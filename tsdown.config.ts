import { defineConfig } from 'tsdown'

export default defineConfig([
  // SDK - CommonJS build
  {
    entry: 'src.ts/sdk/index.ts',
    format: 'cjs',
    outDir: 'lib.commonjs',
    dts: false,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    external: [
      'ethers',
      'crypto-js',
      'circomlibjs',
      'child_process',
      'fs',
      'fs/promises',
      'path',
      'os',
      'crypto',
      'readline',
    ],
    esbuildOptions(options) {
      options.outExtension = { '.js': '.js' }
      return options
    },
  },
  // SDK - ESM build with polyfills
  {
    entry: 'src.ts/sdk/index.ts',
    format: 'esm',
    outDir: 'lib.esm',
    dts: {
      only: false,
    },
    sourcemap: true,
    clean: false,
    target: 'es2022',
    platform: 'browser',
    external: [
      'ethers',
      'crypto-js',
      'circomlibjs',
      'child_process',
      'fs',
      'fs/promises',
      'path',
      'os',
      'crypto',
      'readline',
    ],
    esbuildOptions(options) {
      options.outExtension = { '.js': '.mjs' }
      return options
    },
  },
  // Type definitions only (separate to avoid duplication)
  {
    entry: 'src.ts/sdk/index.ts',
    format: 'esm',
    outDir: 'types',
    dts: {
      only: true,
    },
    clean: false,
  },
  // CLI - CommonJS build
  {
    entry: { 'cli/index': 'src.ts/cli/index.ts' },
    format: 'cjs',
    outDir: 'cli.commonjs',
    dts: false,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    treeshake: true,
    external: [
      'ethers',
      'crypto-js',
      'circomlibjs',
      'child_process',
      'fs',
      'fs/promises',
      'path',
      'os',
      'crypto',
      'readline',
    ],
    esbuildOptions(options) {
      options.outExtension = { '.js': '.js' }
      return options
    },
  },
])
