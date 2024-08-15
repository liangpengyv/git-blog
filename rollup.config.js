import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
  input: 'src/generate.js',
  output: [
    {
      file: 'dist/bundle.js',
      format: 'esm',
    },
  ],
  plugins: [resolve(), commonjs(), json()],
}
