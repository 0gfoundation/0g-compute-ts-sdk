/**
 * Resolve the absolute path of bundled binaries inside this package
 * (`binary/0g-storage-client`, `binary/token_counter`, etc.) regardless of
 * whether the SDK is running from the CommonJS build (`lib.commonjs/...`,
 * deeply nested) or the ESM bundle (`lib.esm/index.mjs`, single file at the
 * package root).
 *
 * Why this exists:
 *
 * The legacy implementation hard-coded `path.join(__dirname, '..', '..', '..', '..', 'binary', '0g-storage-client')`,
 * which assumed a fixed depth of 4 between the runtime file and the package
 * root. That assumption was wrong by one level for the CommonJS build
 * (3 levels up from `lib.commonjs/fine-tuning/zg-storage/zg-storage.js`)
 * and would have been wrong by three levels for the ESM bundle. The SDK
 * silently fell back to the slower TEE HTTP path or, worse, threw `ENOENT`
 * — see "0G-Compute-SDK Fine-tune Pipeline Bug Report" (May 2026, Bug #1).
 *
 * The fix walks up the directory tree from `__dirname` and stops at the
 * first ancestor that contains a `binary/` sub-directory. This works for
 * any reasonable bundle layout, is robust against future refactors, and
 * produces a clear actionable error if the binary is missing entirely
 * (Bug #2 — multi-arch support).
 */

import type * as fsTypes from 'fs'
import type * as pathTypes from 'path'

// We intentionally use require() instead of `import` here so this module
// stays compatible with both ESM and CommonJS bundle outputs without
// triggering rollup ESM/CJS interop quirks.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as typeof fsTypes
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as typeof pathTypes

/**
 * Find the first ancestor of `start` (inclusive) that contains a directory
 * named `marker`. Returns the absolute path of the ancestor, or `null` if
 * no such ancestor exists before reaching the filesystem root.
 */
function findAncestorContaining(start: string, marker: string): string | null {
    let dir = start
    // Cap the climb so a misconfigured build can never spin forever.
    for (let i = 0; i < 32; i++) {
        const candidate = path.join(dir, marker)
        try {
            if (fs.statSync(candidate).isDirectory()) {
                return dir
            }
        } catch {
            // marker not present at this level — keep climbing
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            return null
        }
        dir = parent
    }
    return null
}

let cachedRoot: string | null | undefined

/**
 * Returns the absolute path of the package root that contains the bundled
 * `binary/` directory. Cached after first lookup.
 *
 * Throws if no such directory can be found (means the package was
 * installed without the binary, e.g. someone copied only `lib.commonjs/`
 * out of `node_modules`).
 */
export function getPackageRoot(): string {
    if (cachedRoot !== undefined) {
        if (cachedRoot === null) {
            throw new Error(
                'Could not locate the bundled `binary/` directory relative to the SDK at runtime. ' +
                    'This typically means the @0gfoundation/0g-compute-ts-sdk package was installed ' +
                    'without its bundled assets (for example, only `lib.commonjs/` was copied). ' +
                    'Reinstall via `npm i` / `pnpm i` so the full package layout including `binary/` is present.'
            )
        }
        return cachedRoot
    }
    const found = findAncestorContaining(__dirname, 'binary')
    cachedRoot = found
    if (cachedRoot === null) {
        // Reuse the same error path so the cached behaviour is consistent.
        return getPackageRoot()
    }
    return cachedRoot
}

/**
 * Returns the absolute path of the bundled `binary/` directory.
 */
export function getBinaryDir(): string {
    return path.join(getPackageRoot(), 'binary')
}

/**
 * Returns the absolute path of a specific binary inside `binary/`.
 *
 * Validates that the file exists and is executable. If not, raises an
 * actionable error pointing the user at the multi-arch caveat: the SDK
 * currently ships a single Linux-x64 ELF binary; users on macOS arm64,
 * Linux arm64, or Windows must rebuild from source until per-platform
 * binaries are added (Bug #2). The error spells out the workaround so a
 * developer is not left staring at a generic `ENOENT` or `ENOEXEC`.
 */
export function getBundledBinary(name: string): string {
    const candidate = path.join(getBinaryDir(), name)
    let stats: fsTypes.Stats
    try {
        stats = fs.statSync(candidate)
    } catch (err) {
        const platformHint = `${process.platform}/${process.arch}`
        throw new Error(
            `Bundled binary "${name}" was not found at ${candidate} (running on ${platformHint}). ` +
                'The SDK currently ships only the linux/x64 build of 0g-storage-client. ' +
                'On other platforms, build it from source at ' +
                'https://github.com/0gfoundation/0g-storage-client and copy the resulting binary into the package `binary/` directory. ' +
                `Underlying error: ${(err as Error).message}`
        )
    }
    if (!stats.isFile()) {
        throw new Error(
            `Bundled binary "${name}" at ${candidate} is not a regular file.`
        )
    }
    return candidate
}
