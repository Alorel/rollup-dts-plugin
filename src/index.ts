import * as Bluebird from 'bluebird';
import {promises as fs} from 'fs';
import {join} from 'path';
import {OutputPlugin, PluginContext} from 'rollup';
import {globPromise} from './globPromise';
import {spawnPromise} from './spawnPromise';
import {tmpDir} from './tmpDir';


export interface DtsPluginOptions {
  cliArgs?: string[];

  cwd?: string;

  /**
   * Emit files that only have "export {};" in them
   * @default
   */
  emitEmpties?: boolean;
}

export function dtsPlugin(opts: DtsPluginOptions = {}): OutputPlugin { // eslint-disable-line max-lines-per-function
  const {
    cwd = process.cwd(),
    emitEmpties = false,
    cliArgs = []
  } = opts;

  const baseCliArgs = [
    require.resolve('typescript/bin/tsc'),
    ...cliArgs,
    '--declaration',
    '--emitDeclarationOnly',
    '--outDir'
  ];

  return {
    name: 'dts-plugin',
    renderStart(this: PluginContext, _outputOpts): Promise<void> {
      let dir: string;
      const fileContents: { [k: string]: string } = {};

      return Bluebird.resolve(tmpDir())
        .then(d => {
          baseCliArgs.push(dir = d);

          return spawnPromise(process.execPath, baseCliArgs, {cwd, stdio: 'inherit'});
        })
        .then(() => globPromise('**/*.d.ts', {cwd: dir}))
        .filter(p => {
          const fullPath = join(dir, p);

          const file$ = fs.stat(fullPath).then(s => s.isFile());
          if (emitEmpties) {
            return file$;
          }

          const empty$ = fs.readFile(fullPath, 'utf8')
            .then(contents => {
              if (contents.trim() === 'export {};') {
                return false;
              }

              fileContents[p] = contents;

              return true;
            });

          return Promise.all([file$, empty$])
            .then(([f, e]) => f && e);
        })
        .map(async(fileName: string) => {
          let source: string | Buffer = fileContents[fileName];
          if (!source) {
            source = await fs.readFile(join(dir, fileName));
          }

          this.emitFile({
            fileName,
            source,
            type: 'asset'
          });
        })
        .then(() => {
          // noop, return void
        });
    }
  };
}
