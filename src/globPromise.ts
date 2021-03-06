import {IOptions} from 'glob';
const glob = require('glob'); // eslint-disable-line @typescript-eslint/no-var-requires

/** @internal */
export function globPromise(pat: string, opts: IOptions = {}): Promise<string[]> {
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
