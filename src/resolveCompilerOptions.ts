import {readFileSync} from 'fs';
import {CompilerOptions, readConfigFile} from 'typescript';
import {diagnosticToWarning} from './diagnosticToWarning';

/** @internal */
export function resolveCompilerOptions(
  userProvided: CompilerOptions,
  tsConfig: string
): CompilerOptions {
  const {config, error} = readConfigFile(tsConfig, p => readFileSync(p, 'utf8'));
  if (error) {
    throw Object.assign(Error(), diagnosticToWarning(error));
  }

  const out: CompilerOptions = {
    ...(config.compilerOptions || {}),
    ...userProvided,
    declaration: true,
    emitDeclarationOnly: true,
    sourceMap: false
  };

  if (!out.outDir) {
    throw new Error('rollup-dts-plugin requires an outDir');
  }

  return out;
}
