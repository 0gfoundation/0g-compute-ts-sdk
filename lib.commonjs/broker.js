"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZGComputeNetworkBroker = exports.CONTRACT_ADDRESSES = exports.HARDHAT_CHAIN_ID = exports.MAINNET_CHAIN_ID = exports.TESTNET_CHAIN_ID = void 0;
exports.isDevMode = isDevMode;
exports.getNetworkType = getNetworkType;
exports.createZGComputeNetworkBroker = createZGComputeNetworkBroker;
const ethers_1 = require("ethers");
const ledger_1 = require("./ledger");
const broker_1 = require("./fine-tuning/broker");
const broker_2 = require("./inference/broker/broker");
// Network configurations
exports.TESTNET_CHAIN_ID = 16602n;
exports.MAINNET_CHAIN_ID = 16661n;
exports.HARDHAT_CHAIN_ID = 31337n;
// Contract addresses for different networks
exports.CONTRACT_ADDRESSES = {
    testnet: {
        ledger: '0xE70830508dAc0A97e6c087c75f402f9Be669E406',
        inference: '0xa79F4c8311FF93C06b8CfB403690cc987c93F91E',
        fineTuning: '0xaC66eBd174435c04F1449BBa08157a707B6fa7b1',
    },
    testnetDev: {
        ledger: '0x815B93ab4Ba4BDF530dbF1552649a3c534F8BbF7',
        inference: '0x41bD7Ac5c19000A974D5c192bcd5FB67b56C85c5',
        fineTuning: '0x4e4158DF35CfdC0ac63264D3E112F5B8E9a5c569',
    },
    mainnet: {
        // TODO: Update with actual mainnet addresses when available
        ledger: '0x2dE54c845Cd948B72D2e32e39586fe89607074E3',
        inference: '0x47340d900bdFec2BD393c626E12ea0656F938d84',
        fineTuning: '0x0000000000000000000000000000000000000000',
    },
    hardhat: {
        ledger: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        inference: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        fineTuning: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
    },
};
/**
 * Check if dev mode is enabled
 * Supports multiple ways to enable dev mode:
 * - Node.js: ZG_DEV_MODE environment variable
 * - Next.js: NEXT_PUBLIC_ZG_DEV_MODE environment variable (build-time)
 * - Browser: localStorage 'ZG_DEV_MODE' = 'true'
 * - Browser: URL parameter ?dev=true or ?ZG_DEV_MODE=true
 */
function isDevMode() {
    // Check Node.js / Next.js environment variables
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.ZG_DEV_MODE === 'true' ||
            process.env.ZG_DEV_MODE === '1') {
            return true;
        }
        if (process.env.NEXT_PUBLIC_ZG_DEV_MODE === 'true' ||
            process.env.NEXT_PUBLIC_ZG_DEV_MODE === '1') {
            return true;
        }
    }
    // Check browser localStorage and URL parameters
    if (typeof window !== 'undefined') {
        // Check localStorage
        try {
            const localStorageValue = window.localStorage.getItem('ZG_DEV_MODE');
            if (localStorageValue === 'true' || localStorageValue === '1') {
                return true;
            }
        }
        catch {
            // localStorage not available
        }
        // Check URL parameters
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const devParam = urlParams.get('dev') || urlParams.get('ZG_DEV_MODE');
            if (devParam === 'true' || devParam === '1') {
                return true;
            }
        }
        catch {
            // URL parsing failed
        }
    }
    return false;
}
/**
 * Helper function to determine network type from chain ID
 */
function getNetworkType(chainId) {
    if (chainId === exports.MAINNET_CHAIN_ID) {
        return 'mainnet';
    }
    else if (chainId === exports.TESTNET_CHAIN_ID) {
        return 'testnet';
    }
    else if (chainId === exports.HARDHAT_CHAIN_ID) {
        return 'hardhat';
    }
    return 'unknown';
}
class ZGComputeNetworkBroker {
    ledger;
    inference;
    fineTuning;
    constructor(ledger, inferenceBroker, fineTuningBroker) {
        this.ledger = ledger;
        this.inference = inferenceBroker;
        this.fineTuning = fineTuningBroker;
    }
}
exports.ZGComputeNetworkBroker = ZGComputeNetworkBroker;
/**
 * createZGComputeNetworkBroker is used to initialize ZGComputeNetworkBroker
 *
 * This function automatically detects the network from the signer's provider and uses
 * appropriate contract addresses. You can override any address by providing it explicitly.
 *
 * @param signer - Signer from ethers.js.
 * @param ledgerCA - 0G Compute Network Ledger Contact address, auto-detected if not provided.
 * @param inferenceCA - 0G Compute Network Inference Serving contract address, auto-detected if not provided.
 * @param fineTuningCA - 0G Compute Network Fine Tuning Serving contract address, auto-detected if not provided.
 * @param gasPrice - Gas price for transactions. If not provided, the gas price will be calculated automatically.
 * @param maxGasPrice - Maximum gas price for transactions.
 * @param step - Step for gas price adjustment.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
async function createZGComputeNetworkBroker(signer, ledgerCA, inferenceCA, fineTuningCA, gasPrice, maxGasPrice, step) {
    try {
        // Auto-detect network from signer's provider
        let defaultAddresses = exports.CONTRACT_ADDRESSES.testnet; // Default to testnet
        if (signer.provider) {
            const network = await signer.provider.getNetwork();
            const chainId = network.chainId;
            if (chainId === exports.MAINNET_CHAIN_ID) {
                defaultAddresses = exports.CONTRACT_ADDRESSES.mainnet;
                console.log(`Detected mainnet (chain ID: ${chainId})`);
            }
            else if (chainId === exports.TESTNET_CHAIN_ID) {
                if (isDevMode()) {
                    defaultAddresses = exports.CONTRACT_ADDRESSES.testnetDev;
                    console.log(`Detected testnet [DEV MODE] (chain ID: ${chainId})`);
                }
                else {
                    defaultAddresses = exports.CONTRACT_ADDRESSES.testnet;
                    console.log(`Detected testnet (chain ID: ${chainId})`);
                }
            }
            else if (chainId === exports.HARDHAT_CHAIN_ID) {
                defaultAddresses = exports.CONTRACT_ADDRESSES.hardhat;
                console.log(`Detected hardhat (chain ID: ${chainId})`);
            }
            else {
                console.warn(`Unknown chain ID: ${chainId}. Using testnet addresses as default.`);
            }
        }
        else {
            console.warn('No provider found on signer. Using testnet addresses as default.');
        }
        // Use provided addresses or fall back to auto-detected defaults
        const finalLedgerCA = ledgerCA || defaultAddresses.ledger;
        const finalInferenceCA = inferenceCA || defaultAddresses.inference;
        const finalFineTuningCA = fineTuningCA || defaultAddresses.fineTuning;
        const ledger = await (0, ledger_1.createLedgerBroker)(signer, finalLedgerCA, finalInferenceCA, finalFineTuningCA, gasPrice, maxGasPrice, step);
        const inferenceBroker = await (0, broker_2.createInferenceBroker)(signer, finalInferenceCA, ledger);
        let fineTuningBroker;
        if (signer instanceof ethers_1.Wallet) {
            fineTuningBroker = await (0, broker_1.createFineTuningBroker)(signer, finalFineTuningCA, ledger, gasPrice, maxGasPrice, step);
        }
        const broker = new ZGComputeNetworkBroker(ledger, inferenceBroker, fineTuningBroker);
        return broker;
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=broker.js.map