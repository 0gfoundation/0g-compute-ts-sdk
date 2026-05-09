// STRICT empty ESM stub specifically for the `'fs'` module.
//
// This is the regression-test linchpin for the v0.8.2 → v0.8.3 fix
// (PR #216): the SDK previously had top-level
//   - `import { createWriteStream } from 'fs'`     (provider.ts)
//   - `import * as fs from 'fs'` + `fs.statSync(…)` (binary-path.ts)
// which surfaced as Turbopack errors:
//   - "Export createWriteStream doesn't exist in target module"
//   - "Export statSync doesn't exist in target module"
// once `'fs'` was aliased away from the real Node builtin in a browser
// build. The fix moved both to lazy `await import('fs')` inside Node-only
// async functions, so the SDK's ESM bundle no longer carries any top-level
// import from `'fs'`.
//
// We keep this stub as ESM with an empty default export and ZERO named
// exports on purpose: Turbopack performs strict named-export validation
// against ESM modules. If anyone reintroduces a top-level
// `import { … } from 'fs'` (or `import * as fs from 'fs'` followed by a
// statically-resolved `fs.<symbol>` access) the build fails here, with the
// same error class the original bug report carried.
//
// DO NOT add named exports to this file to "fix" a build failure — fix the
// SDK by deferring the import to runtime instead.
export default {}
