import {createFilter, FilterPattern} from '@rollup/pluginutils';
import {OutputPlugin} from 'rollup';
import {CompilerOptions, createCompilerHost, createProgram} from 'typescript';
import {createModuleReducer} from './createModuleReducer';
import {resolveCompilerOptions} from './resolveCompilerOptions';

//tslint:disable:no-invalid-this

export interface DtsPluginOptions {
  baseDir?: string;

  compilerOptions?: CompilerOptions;

  exclude?: FilterPattern;

  include?: FilterPattern;

  tsConfig?: string;
}

export function dtsPlugin(opts: DtsPluginOptions = {}): OutputPlugin {
  const {
    tsConfig = './tsconfig.json',
    compilerOptions = {},
    include = /\.tsx?$/,
    exclude
  } = opts;

  const moduleReducer = createModuleReducer(createFilter(include, exclude));
  const resolvedCompilerOptions = resolveCompilerOptions(compilerOptions, tsConfig);
  const regReplace = new RegExp(`^${resolvedCompilerOptions.outDir}/?`);

  return {
    generateBundle(_opts, bundle) {
      const moduleSet: Set<string> = Object.values(bundle)
        .reduce(moduleReducer, new Set<string>());

      if (!moduleSet.size) {
        return;
      }

      const createdFiles: Map<string, string> = new Map();
      const host = createCompilerHost(resolvedCompilerOptions);

      host.writeFile = (fileName, data) => {
        createdFiles.set(fileName.replace(regReplace, ''), data);
      };
      const prog = createProgram({
        host,
        options: resolvedCompilerOptions,
        rootNames: Array.from(moduleSet)
      });
      prog.emit();

      for (const [fileName, source] of createdFiles) {
        this.emitFile({
          fileName,
          source,
          type: 'asset'
        });
      }
    },
    name: 'dts-plugin'
  };
}
