// Regression fixture for browser-bundler compatibility of the SDK's ESM
// bundle. Two builds run against this app in CI:
//
//   - `next build`              (Webpack)
//   - `next build --turbopack`  (Turbopack — the strict ESM-aware bundler
//                                that originally surfaced the
//                                "Export … doesn't exist in target module"
//                                bug class.)
//
// IMPORTANT: this config is intentionally **minimal**. We do NOT pre-stub
// Node-only specifiers (fs, fs/promises, stream/promises, child_process,
// path, os, readline, net, tls) here. Those stubs come from the SDK's own
// `package.json` `"browser"` map, so an external user landing on a vanilla
// `next build` should not have to add any per-project resolve fallback or
// turbopack alias. If this fixture stops building, the SDK itself has
// regressed — fix the SDK, do not patch around it here.
//
// The earlier version of this fixture pre-configured webpack
// `resolve.fallback` and turbopack `resolveAlias` for every Node-only
// specifier, which (as Hongji Cai pointed out in 2026-05) only verified
// "expert user" usage and missed the open-source case where partners
// install the SDK in their own Next.js app and don't know to add stubs.

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['@0gfoundation/0g-compute-ts-sdk'],
    output: 'export',
    images: { unoptimized: true },
}

export default nextConfig
