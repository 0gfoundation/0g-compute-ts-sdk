// Regression fixture for browser-bundler compatibility of the SDK's ESM
// bundle. Two builds run against this app in CI:
//
//   - `next build` (Webpack)         — the established consumer setup, mirrors
//                                       the configuration used by web-ui/.
//   - `next build --turbopack`       — the strict ESM-aware bundler that
//                                       originally surfaced the
//                                       "Export createWriteStream / statSync
//                                       doesn't exist in target module" bug.
//
// Both builds must succeed for the SDK to be considered browser-safe.

import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// Turbopack `resolveAlias` interprets string values as paths relative to the
// project root (the leading `./` is required). Absolute paths get prefixed
// with `.` and treated relative, which fails to resolve.
//
// Two stubs by design:
//
//   - `fs-strict.mjs` is an ESM module with NO named exports. Aliased ONLY
//     to the bare `'fs'` specifier, it forces Turbopack's strict named-
//     export validation to flag any top-level `import { … } from 'fs'` or
//     statically-resolved `fs.<symbol>` access that creeps back into the
//     SDK bundle. This is the regression check for PR #216.
//   - `node-permissive.cjs` is a CJS empty module. Aliased to the other
//     Node-only specifiers (`fs/promises`, `stream/promises`,
//     `child_process`, `readline`, `net`, `tls`) where the SDK currently
//     does have legitimate top-level imports we are not policing here.
const fsStrict = './stubs/fs-strict.mjs'
const nodePermissive = './stubs/node-permissive.cjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['@0gfoundation/0g-compute-ts-sdk'],
    output: 'export',
    images: { unoptimized: true },

    // Webpack: stub Node-only modules to `false` (empty module) and provide
    // browser polyfills for the modules we do need on the client. Mirrors the
    // setup in web-ui/next.config.mjs.
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                child_process: false,
                'fs/promises': false,
                'stream/promises': false,
                readline: false,
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
                buffer: require.resolve('buffer/'),
                util: require.resolve('util/'),
            }
        }
        return config
    },

    // Turbopack: `resolveAlias` is the analogue of webpack's
    // `resolve.fallback`. There is no `false` shorthand, so every Node-only
    // module is aliased to the local empty stub.
    turbopack: {
        resolveAlias: {
            fs: fsStrict,
            'fs/promises': nodePermissive,
            'stream/promises': nodePermissive,
            child_process: nodePermissive,
            readline: nodePermissive,
            net: nodePermissive,
            tls: nodePermissive,
        },
    },
}

export default nextConfig
