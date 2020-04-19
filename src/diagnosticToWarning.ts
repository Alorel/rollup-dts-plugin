import {Diagnostic, flattenDiagnosticMessageText} from 'typescript';

/** @internal */
export function diagnosticToWarning(diagnostic: Diagnostic) {
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
