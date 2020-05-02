import * as glob from 'glob';

/** @internal */
export function globPromise(pat: string, opts: glob.IOptions = {}): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    glob(pat, opts, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
}
