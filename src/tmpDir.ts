import * as tmp from 'tmp';

tmp.setGracefulCleanup();

/** @internal */
export function tmpDir(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    tmp.dir({keep: false, unsafeCleanup: true}, (err, name) => {
      if (err) {
        reject(err);
      } else {
        resolve(name);
      }
    });
  });
}
