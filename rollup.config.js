import {join} from 'path';
import tscPlugin from '@rollup/plugin-typescript';
import copyPkgJson from './build/copy-pkg-json';
import cpPlugin from './build/copy-plugin';
import cleanPlugin from './build/clean';
import {dependencies, peerDependencies} from './package.json';

const isDtsRun = !!process.env.DTS_RUN_DIST;

function mkOutput(overrides = {}) {
  return {
    dir: join(__dirname, 'dist'),
    assetFileNames: '[name][extname]',
    sourcemap: false,
    ...overrides
  }
}

export default {
  input: join(__dirname, 'src', 'index.ts'),
  external: Array.from(
    new Set(
      Object.keys(dependencies)
        .concat(Object.keys(peerDependencies))
        .concat('util', 'fs', 'path')
    )
  ),
  plugins: [
    !isDtsRun && cleanPlugin(),
    tscPlugin({
      tsconfig: join(__dirname, 'tsconfig.json')
    })
  ],
  output: [
    !isDtsRun && mkOutput({
      entryFileNames: '[name].cjs.js',
      format: 'cjs'
    }),
    mkOutput({
      entryFileNames: '[name].es.js',
      format: 'esm',
      plugins: [
        !isDtsRun && copyPkgJson(),
        isDtsRun && require('./dist/index.cjs').dtsPlugin(),
        !isDtsRun && cpPlugin({
          files: [
            'LICENSE',
            'CHANGELOG.md',
            'README.md'
          ]
        })
      ]
    })
  ]
};
