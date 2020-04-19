import {createFilter} from '@rollup/pluginutils';
import {OutputAsset, OutputChunk} from 'rollup';

/** @internal */
export function createModuleReducer(
  filter: ReturnType<typeof createFilter>
): (acc: Set<string>, chunk: OutputAsset | OutputChunk) => Set<string> {
  return (acc, chunk) => {
    if (chunk.type === 'chunk') {
      for (const m of Object.keys(chunk.modules)) {
        if (filter(m)) {
          acc.add(m);
        }
      }
    }

    return acc;
  };
}
