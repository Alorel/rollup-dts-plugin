import * as tmp from 'tmp';

tmp.setGracefulCleanup();

/** @internal */
export function tmpDir(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    tmp.dir({unsafeCleanup: true, keep: false}, (err, name) => {
      if (err) {
        reject(err);
      } else {
        resolve(name);
      }
    });
  });
}
