// PERMISSIVE CJS empty stub for non-`fs` Node-only modules
// (`fs/promises`, `stream/promises`, `child_process`, `readline`, `net`,
// `tls`).
//
// CJS is intentional: Turbopack treats a CJS module's export shape as
// dynamic and does not statically validate named imports against it. That
// is what we want HERE — these modules legitimately have top-level static
// imports in the current SDK ESM bundle (e.g.
// `import * as fs$1 from 'fs/promises'`,
// `import { pipeline } from 'stream/promises'`,
// `import { spawn } from 'child_process'`). They are not what the
// user-reported regression was about, and constraining them strictly would
// make this fixture flag pre-existing, accepted SDK behaviour as a failure.
//
// The strict-ESM check that catches the regression class lives in
// `./fs-strict.mjs`, which is aliased only for the `'fs'` module.
module.exports = {}
module.exports.default = {}
