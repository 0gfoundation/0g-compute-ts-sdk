#!/usr/bin/env node
const path = require('path')

// Resolve the new package's entry point, walk up to the package root,
// then load its CLI directly. This avoids the new package's `exports`
// field blocking subpath imports.
const entryPath = require.resolve('@0gfoundation/0g-compute-ts-sdk')
const pkgRoot = path.resolve(path.dirname(entryPath), '..')
require(path.join(pkgRoot, 'cli.commonjs', 'cli', 'index.js'))
