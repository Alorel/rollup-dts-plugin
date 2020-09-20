import {SpawnOptions} from 'child_process';
const spawn = require('cross-spawn'); // eslint-disable-line @typescript-eslint/no-var-requires

/** @internal */
export function spawnPromise(
  cmd: string,
  args: string[],
  opts: SpawnOptions = {stdio: 'inherit'}
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    const proc = spawn(cmd, args, opts);

    function doResolve() {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }

    function doReject(e) {
      if (!resolved) {
        resolved = true;
        reject(e);
      }
    }

    proc
      .once('error', doReject)
      .once('exit', code => {
        code === 0 ? doResolve() : doReject(new Error(`tsc exited with ${code}`));
      });
  });
}
