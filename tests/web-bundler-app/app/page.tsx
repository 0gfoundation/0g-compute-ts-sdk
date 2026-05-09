'use client'

// Pulls the entire SDK surface into the client bundle so the Node-only
// transitive deps (fine-tuning provider, zg-storage, binary-path, etc.) all
// have to survive browser-bundler analysis. The actual values are inspected
// via `typeof` so the bundler can't tree-shake them away.
import {
    createZGComputeNetworkBroker,
    FineTuningBroker,
    InferenceBroker,
    LedgerBroker,
} from '@0gfoundation/0g-compute-ts-sdk'

export default function Page() {
    const probes = [
        typeof createZGComputeNetworkBroker,
        typeof FineTuningBroker,
        typeof InferenceBroker,
        typeof LedgerBroker,
    ].join(',')
    return <pre>{probes}</pre>
}
