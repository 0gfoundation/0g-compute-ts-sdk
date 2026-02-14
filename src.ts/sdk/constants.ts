// Network configurations
export const TESTNET_CHAIN_ID = 16602n
export const MAINNET_CHAIN_ID = 16661n
export const HARDHAT_CHAIN_ID = 31337n

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
    testnet: {
        ledger: '0xE70830508dAc0A97e6c087c75f402f9Be669E406',
        inference: '0xa79F4c8311FF93C06b8CfB403690cc987c93F91E',
        fineTuning: '0xC6C075D8039763C8f1EbE580be5ADdf2fd6941bA',
    },
    testnetDev: {
        ledger: '0x815B93ab4Ba4BDF530dbF1552649a3c534F8BbF7',
        inference: '0x41bD7Ac5c19000A974D5c192bcd5FB67b56C85c5',
        fineTuning: '0x4e4158DF35CfdC0ac63264D3E112F5B8E9a5c569',
    },
    mainnet: {
        ledger: '0x2dE54c845Cd948B72D2e32e39586fe89607074E3',
        inference: '0x47340d900bdFec2BD393c626E12ea0656F938d84',
        fineTuning: '0x4e3474095518883744ddf135b7E0A23301c7F9c0',
    },
    hardhat: {
        ledger: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        inference: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        fineTuning: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
    },
} as const

/**
 * Check if dev mode is enabled
 * Supports multiple ways to enable dev mode:
 * - Node.js: ZG_DEV_MODE environment variable
 * - Next.js: NEXT_PUBLIC_ZG_DEV_MODE environment variable (build-time)
 * - Browser: localStorage 'ZG_DEV_MODE' = 'true'
 * - Browser: URL parameter ?dev=true or ?ZG_DEV_MODE=true
 */
export function isDevMode(): boolean {
    // Check Node.js / Next.js environment variables
    if (typeof process !== 'undefined' && process.env) {
        if (
            process.env.ZG_DEV_MODE === 'true' ||
            process.env.ZG_DEV_MODE === '1'
        ) {
            return true
        }
        if (
            process.env.NEXT_PUBLIC_ZG_DEV_MODE === 'true' ||
            process.env.NEXT_PUBLIC_ZG_DEV_MODE === '1'
        ) {
            return true
        }
    }

    // Check browser localStorage and URL parameters
    if (typeof window !== 'undefined') {
        // Check localStorage
        try {
            const localStorageValue = window.localStorage.getItem('ZG_DEV_MODE')
            if (localStorageValue === 'true' || localStorageValue === '1') {
                return true
            }
        } catch {
            // localStorage not available
        }

        // Check URL parameters
        try {
            const urlParams = new URLSearchParams(window.location.search)
            const devParam =
                urlParams.get('dev') || urlParams.get('ZG_DEV_MODE')
            if (devParam === 'true' || devParam === '1') {
                return true
            }
        } catch {
            // URL parsing failed
        }
    }

    return false
}
