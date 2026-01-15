import type { JsonRpcSigner } from 'ethers';
import { Wallet } from 'ethers';
import type { InferenceBroker } from './inference/broker/broker';
import type { LedgerBroker } from './ledger';
import type { FineTuningBroker } from './fine-tuning/broker';
export declare const TESTNET_CHAIN_ID = 16602n;
export declare const MAINNET_CHAIN_ID = 16661n;
export declare const HARDHAT_CHAIN_ID = 31337n;
export declare const CONTRACT_ADDRESSES: {
    readonly testnet: {
        readonly ledger: "0xE70830508dAc0A97e6c087c75f402f9Be669E406";
        readonly inference: "0xa79F4c8311FF93C06b8CfB403690cc987c93F91E";
        readonly fineTuning: "0xaC66eBd174435c04F1449BBa08157a707B6fa7b1";
    };
    readonly testnetDev: {
        readonly ledger: "0xf248Baaee6A4dC84bac4675906F8dBd2D761356B";
        readonly inference: "0x335c02f5F1A01b54Ae7a4974c5Dd2853C3300C95";
        readonly fineTuning: "0x933ecA2F203840Dc2fA05878a52C4a99aB13F8B1";
    };
    readonly mainnet: {
        readonly ledger: "0x2dE54c845Cd948B72D2e32e39586fe89607074E3";
        readonly inference: "0x47340d900bdFec2BD393c626E12ea0656F938d84";
        readonly fineTuning: "0x0000000000000000000000000000000000000000";
    };
    readonly hardhat: {
        readonly ledger: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        readonly inference: "0x0165878A594ca255338adfa4d48449f69242Eb8F";
        readonly fineTuning: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
    };
};
/**
 * Check if dev mode is enabled
 * Supports multiple ways to enable dev mode:
 * - Node.js: ZG_DEV_MODE environment variable
 * - Next.js: NEXT_PUBLIC_ZG_DEV_MODE environment variable (build-time)
 * - Browser: localStorage 'ZG_DEV_MODE' = 'true'
 * - Browser: URL parameter ?dev=true or ?ZG_DEV_MODE=true
 */
export declare function isDevMode(): boolean;
/**
 * Helper function to determine network type from chain ID
 */
export declare function getNetworkType(chainId: bigint): 'mainnet' | 'testnet' | 'hardhat' | 'unknown';
export declare class ZGComputeNetworkBroker {
    ledger: LedgerBroker;
    inference: InferenceBroker;
    fineTuning?: FineTuningBroker;
    constructor(ledger: LedgerBroker, inferenceBroker: InferenceBroker, fineTuningBroker?: FineTuningBroker);
}
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
export declare function createZGComputeNetworkBroker(signer: JsonRpcSigner | Wallet, ledgerCA?: string, inferenceCA?: string, fineTuningCA?: string, gasPrice?: number, maxGasPrice?: number, step?: number): Promise<ZGComputeNetworkBroker>;
//# sourceMappingURL=broker.d.ts.map