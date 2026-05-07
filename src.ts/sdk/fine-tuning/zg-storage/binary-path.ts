/**
 * Resolve the absolute path of bundled binaries inside this package
 * (`binary/0g-storage-client`, `binary/token_counter`, etc.) regardless of
 * whether the SDK is running from the CommonJS build (`lib.commonjs/...`,
 * deeply nested) or the ESM bundle (`lib.esm/index.mjs`, single file at the
 * package root).
 *
 * Why this exists:
 *
 * The legacy implementation hard-coded
 * `path.join(__dirname, '..', '..', '..', '..', 'binary', '0g-storage-client')`,
 * which assumed a fixed depth of 4 between the runtime file and the package
 * root. That assumption was wrong by one level for the CommonJS build
 * (3 levels up from `lib.commonjs/fine-tuning/zg-storage/zg-storage.js`)
 * and would have been wrong by three levels for the ESM bundle. The SDK
 * silently fell back to the slower TEE HTTP path or, worse, threw `ENOENT`
 * — see "0G-Compute-SDK Fine-tune Pipeline Bug Report" (May 2026, Bug #1).
 *
 * The fix walks up the directory tree from a known anchor and stops at the
 * first ancestor that contains a `binary/` sub-directory. This works for
 * any reasonable bundle layout, is robust against future refactors, and
 * produces a clear actionable error if the binary is missing entirely
 * (Bug #2 — multi-arch support).
 *
 * Note on the dual ESM/CJS build:
 *
 *   - We use standard `import` statements for `fs`/`path` so tsc emits
 *     CJS `require()` for `lib.commonjs/` and rollup keeps them as ES
 *     imports for `lib.esm/`. We do NOT use top-level `require()`:
 *     Node 22+ refuses to load any ESM file containing `require()` calls
 *     mixed with top-level `await`, which would break SDK import for every
 *     ESM consumer of the package.
 *   - `__dirname` is module-scoped in CJS (Node injects it into each
 *     module wrapper) and is provided in the ESM bundle via a banner
 *     shim defined in `rollup.config.mjs` that derives it from
 *     `import.meta.url` once at the top of `lib.esm/index.mjs`. This
 *     guarantees the anchor lives inside the installed package
 *     (`<pkg>/lib.esm/` for ESM, `<pkg>/lib.commonjs/.../zg-storage/`
 *     for CJS) so the upward `findAncestorContaining` walk locates
 *     `<pkg>/binary/` reliably regardless of the consumer's `cwd`.
 *
 *     The earlier `process.cwd()` fallback was incorrect for the ESM
 *     case: from a downstream ESM consumer, `cwd` is the consumer's
 *     project root and the SDK's `binary/` directory lives **below**
 *     it inside `node_modules/`, so an upward walk would never find it.
 *     The fallback is retained only as a defensive guard for unusual
 *     bundlers that might strip the banner; in the standard rollup
 *     output `__dirname` is always defined and the fallback is unused.
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * Best-effort directory anchor for the running module.
 *
 * - CommonJS: returns the per-module `__dirname` Node injects into each
 *   module's lexical scope. Note that `__dirname` is **not** a global on
 *   `globalThis` — it is supplied by Node's module wrapper. This is why
 *   we read it lexically (the `typeof __dirname !== 'undefined'` check
 *   is the standard JS idiom for reading a possibly-undeclared symbol
 *   without raising `ReferenceError`).
 * - ESM bundle: `__dirname` is undeclared, so we fall back to
 *   `process.cwd()`. The downstream `findAncestorContaining` walk can
 *   still recover the correct `binary/` directory when the consumer is
 *   running from inside the installed package tree.
 */
function getAnchorDir(): string {
    if (typeof __dirname !== 'undefined') {
        return __dirname
    }
    return process.cwd()
}

/**
 * Find the first ancestor of `start` (inclusive) that contains a directory
 * named `marker`. Returns the absolute path of the ancestor, or `null` if
 * no such ancestor exists before reaching the filesystem root.
 */
function findAncestorContaining(start: string, marker: string): string | null {
    let dir = start
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
    const found = findAncestorContaining(getAnchorDir(), 'binary')
    cachedRoot = found
    if (cachedRoot === null) {
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
 * Validates that the file exists and is a regular file. If not, raises an
 * actionable error pointing the user at the multi-arch caveat: the SDK
 * currently ships a single Linux-x64 ELF binary; users on macOS arm64,
 * Linux arm64, or Windows must rebuild from source until per-platform
 * binaries are added (Bug #2). The error spells out the workaround so a
 * developer is not left staring at a generic `ENOENT` or `ENOEXEC`.
 */
export function getBundledBinary(name: string): string {
    const candidate = path.join(getBinaryDir(), name)
    let stats: fs.Stats
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
