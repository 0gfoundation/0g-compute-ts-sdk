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
// Banner runs at module init in every consumer environment, including
// browser bundlers. Importing from `url`/`path` here is a trap: browser
// polyfills like `url@0.11.x` don't expose `fileURLToPath`, so any call
// crashes on load. Worse, webpack/terser statically infer the `url`
// module shape and fold away both `typeof` guards and `try/catch` blocks
// around the call, so defensive wrappers don't survive minification.
//
// We avoid the imports entirely and derive `__filename`/`__dirname` from
// `import.meta.url` with pure string ops:
//   - In Node ESM (`file:///abs/path/to/lib.esm/index.mjs`) the strip /
//     drive-letter regex matches what `fileURLToPath` produces.
//   - In browser bundles, `binary-path.ts` is never invoked, so the
//     baked-in build-machine path is harmless.
//
// See PR #208 review feedback (Bug Report — May 2026, Bug #1) and the
// follow-up browser-compat issue surfaced by the v0.8.2 web-ui build.
const esmDirnameShim = [
    "const __filename = (typeof import.meta !== 'undefined' && typeof import.meta.url === 'string')",
    "    ? decodeURI(import.meta.url.replace(/^file:\\/\\//, '').replace(/^\\/([A-Za-z]:)/, '$1'))",
    "    : ''",
    "const __dirname = __filename ? __filename.replace(/[\\/\\\\][^\\/\\\\]*$/, '') : ''",
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
