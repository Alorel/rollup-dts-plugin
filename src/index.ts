import {createFilter, FilterPattern} from '@rollup/pluginutils';
import {readFileSync} from 'fs';
import {OutputAsset, OutputChunk, OutputPlugin} from 'rollup';
import {
  CompilerOptions,
  createCompilerHost,
  createProgram,
  Diagnostic,
  flattenDiagnosticMessageText,
  readConfigFile
} from 'typescript';

//tslint:disable:no-invalid-this

export interface DtsPluginOptions {
  baseDir?: string;

  compilerOptions?: CompilerOptions;

  exclude?: FilterPattern;

  include?: FilterPattern;

  tsConfig?: string;
}

function diagnosticToWarning(diagnostic: Diagnostic) {
  const pluginCode = `TS${diagnostic.code}`;
  const message: string = flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  // Build a Rollup warning object from the diagnostics object.
  const warning: { [k: string]: any } = {
    message: `@alorel/rollup-plugin-dts ${pluginCode}: ${message}`,
    pluginCode
  };
  if (diagnostic.file) {
    //tslint:disable:no-useless-cast restrict-plus-operands
    // Add information about the file location
    const {line, character} = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
    warning.loc = {
      column: character + 1,
      file: diagnostic.file.fileName,
      line: line + 1
    };
    //tslint:enable:no-useless-cast restrict-plus-operands
  }

  return warning;
}

export function dtsPlugin(opts: DtsPluginOptions = {}): OutputPlugin {
  const {
    tsConfig = './tsconfig.json',
    compilerOptions = {},
    include = /\.tsx?$/,
    exclude
  } = opts;

  const filter = createFilter(include, exclude);

  function moduleReducer(acc: Set<string>, chunk: OutputAsset | OutputChunk): Set<string> {
    if (chunk.type === 'chunk') {
      for (const m of Object.keys(chunk.modules)) {
        if (filter(m)) {
          acc.add(m);
        }
      }
    }

    return acc;
  }

  const resolvedCompilerOptions: CompilerOptions = (() => {
    const {config, error} = readConfigFile(tsConfig, p => readFileSync(p, 'utf8'));
    if (error) {
      throw Object.assign(Error(), diagnosticToWarning(error));
    }

    const out: CompilerOptions = {
      ...(config.compilerOptions || {}),
      ...compilerOptions,
      declaration: true,
      emitDeclarationOnly: true,
      sourceMap: false
    };

    if (!out.outDir) {
      throw new Error('rollup-dts-plugin requires an outDir');
    }

    return out;
  })();

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
