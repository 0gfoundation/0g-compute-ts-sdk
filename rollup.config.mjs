import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'

// Inject a Node-compatible `__dirname` (and `__filename`) shim at the top of
// the ESM bundle. Without this, `__dirname` is undefined inside `lib.esm/
// index.mjs`, which breaks `binary-path.ts`'s anchor resolution for any
// downstream ESM consumer (the fallback to `process.cwd()` walks **upward**
// from the consumer's project root and never finds the
// `node_modules/@0gfoundation/0g-compute-ts-sdk/binary/` directory below it).
//
// This restores parity with the CommonJS build, where Node injects
// `__dirname` per module. With the shim, the anchor lands inside the
// installed package (`<pkg>/lib.esm/`) and `findAncestorContaining`
// correctly resolves `<pkg>/binary/` one level up.
//
// See PR #208 review feedback (Bug Report — May 2026, Bug #1).
const esmDirnameShim = [
    "import { fileURLToPath as __zg_fileURLToPath } from 'url'",
    "import { dirname as __zg_dirname } from 'path'",
    'const __filename = __zg_fileURLToPath(import.meta.url)',
    'const __dirname = __zg_dirname(__filename)',
].join('\n')

export default [
    {
        input: 'src.ts/sdk/index.ts',
        output: {
            dir: 'lib.esm',
            format: 'esm',
            sourcemap: true,
            entryFileNames: 'index.mjs',
            banner: esmDirnameShim,
        },
        plugins: [
            json(),
            resolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            nodePolyfills({
                include: ['crypto', 'stream', 'util', 'buffer'],
            }),
            typescript({
                tsconfig: './tsconfig.esm.json',
            }),
        ],
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
            'stream/promises',
        ],
    },
    {
        input: 'lib.esm/index.d.ts',
        output: {
            file: 'lib.esm/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
]
