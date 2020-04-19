import {createFilter, FilterPattern} from '@rollup/pluginutils';
import {OutputPlugin} from 'rollup';
import {CompilerOptions, createProgram} from 'typescript';
import {createCompilerHost} from './createCompilerHost';
import {createModuleReducer} from './createModuleReducer';
import {resolveCompilerOptions} from './resolveCompilerOptions';

//tslint:disable:no-invalid-this

export interface DtsPluginOptions {
  baseDir?: string;

  compilerOptions?: CompilerOptions;

  /** Emit files that only have "export {};" in them */
  emitEmpties?: false;

  exclude?: FilterPattern;

  include?: FilterPattern;

  tsConfig?: string;
}

export function dtsPlugin(opts: DtsPluginOptions = {}): OutputPlugin {
  const {
    tsConfig = './tsconfig.json',
    emitEmpties = false,
    compilerOptions = {},
    include = /\.tsx?$/,
    exclude
  } = opts;

  const moduleReducer = createModuleReducer(createFilter(include, exclude));
  const resolvedCompilerOptions = resolveCompilerOptions(compilerOptions, tsConfig);

  return {
    generateBundle(_opts, bundle) {
      const moduleSet: Set<string> = Object.values(bundle)
        .reduce(moduleReducer, new Set<string>());

      if (!moduleSet.size) {
        return;
      }

      const {host, createdFiles} = createCompilerHost(emitEmpties, resolvedCompilerOptions);
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
