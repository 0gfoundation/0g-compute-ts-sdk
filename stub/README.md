# @0glabs/0g-serving-broker — DEPRECATED

> 📦 **This package has been renamed to [`@0gfoundation/0g-compute-ts-sdk`](https://www.npmjs.com/package/@0gfoundation/0g-compute-ts-sdk).**
>
> This `0.7.7` release is a thin re-export shim that depends on `@0gfoundation/0g-compute-ts-sdk@^0.8.0`. Existing code keeps working, but **please migrate** — this package will not receive further updates.

## Migration

Update your dependency:

```bash
npm uninstall @0glabs/0g-serving-broker
npm install @0gfoundation/0g-compute-ts-sdk
```

Update your imports:

```diff
- import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
+ import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk'
```

Or run this one-liner from your project root:

```bash
grep -rl --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
    '@0glabs/0g-serving-broker' . \
  | xargs sed -i 's|@0glabs/0g-serving-broker|@0gfoundation/0g-compute-ts-sdk|g'
```

The public API is unchanged — only the package name moved.

## Links

- New package: <https://www.npmjs.com/package/@0gfoundation/0g-compute-ts-sdk>
- Source / docs: <https://github.com/0gfoundation/0g-serving-user-broker>
- Issues: <https://github.com/0gfoundation/0g-serving-user-broker/issues>
