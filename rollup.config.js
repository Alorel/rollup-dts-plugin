import {join} from 'path';
import tscPlugin from '@rollup/plugin-typescript';
import copyPkgJson from './build/copy-pkg-json';
import cpPlugin from './build/copy-plugin';
import cleanPlugin from './build/clean';
import {dependencies, peerDependencies} from './package.json';

const isDtsRun = !!process.env.DTS_RUN_DIST;

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
    }),
  ],
  output: {
    dir: join(__dirname, 'dist'),
    assetFileNames: '[name][extname]',
    entryFileNames: '[name].js',
    sourcemap: false,
    format: 'cjs',
    plugins: [
      !isDtsRun && copyPkgJson(),
      isDtsRun && require('./dist').dtsPlugin({
        cliArgs: ['--rootDir', 'src']
      }),
      !isDtsRun && cpPlugin({
        files: [
          'LICENSE',
          'CHANGELOG.md',
          'README.md'
        ]
      })
    ]
  }
};
