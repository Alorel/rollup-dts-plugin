import {CompilerHost, CompilerOptions, createCompilerHost as tsCreateCompilerHost} from 'typescript';

/** @internal */
interface CreateCompilerHost {
  createdFiles: Map<string, string>;

  host: CompilerHost;
}

/** @internal */
export function createCompilerHost(emitEmpties: boolean, compilerOpts: CompilerOptions): CreateCompilerHost {
  const createdFiles: Map<string, string> = new Map();
  const host = tsCreateCompilerHost(compilerOpts);
  const regReplace = new RegExp(`^${compilerOpts.outDir}/?`);

  function baseWriteFile(fileName: string, data: string): void {
    createdFiles.set(fileName.replace(regReplace, ''), data);
  }

  if (emitEmpties) {
    host.writeFile = baseWriteFile;
  } else {
    host.writeFile = (fileName, data) => {
      if (data.trim() !== 'export {};') {
        baseWriteFile(fileName, data);
      }
    };
  }

  return {createdFiles, host};
}
