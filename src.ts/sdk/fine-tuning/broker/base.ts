import type { FineTuningServingContract } from '../contract'
import type { LedgerBroker } from '../../ledger'
import type { Provider } from '../provider/provider'
import { getNetworkType } from '../../broker'
import {
    ZG_RPC_ENDPOINT_TESTNET,
    ZG_RPC_ENDPOINT_MAINNET,
    INDEXER_URL_TESTNET_TURBO,
    INDEXER_URL_MAINNET_TURBO,
} from '../const'
import type { StorageConfig } from '../zg-storage'

export abstract class BrokerBase {
    protected contract: FineTuningServingContract
    protected ledger: LedgerBroker
    protected servingProvider: Provider

    constructor(
        contract: FineTuningServingContract,
        ledger: LedgerBroker,
        servingProvider: Provider
    ) {
        this.contract = contract
        this.ledger = ledger
        this.servingProvider = servingProvider
    }

    /**
     * Get storage configuration based on current network
     */
    protected async getStorageConfig(): Promise<StorageConfig> {
        try {
            const chainId = await this.contract.signer.provider?.getNetwork().then(n => n.chainId)
            const networkType = chainId ? getNetworkType(chainId) : 'unknown'

            if (networkType === 'mainnet') {
                return {
                    rpcUrl: ZG_RPC_ENDPOINT_MAINNET,
                    indexerUrl: INDEXER_URL_MAINNET_TURBO,
                }
            } else {
                // Default to testnet for testnet, hardhat, and unknown networks
                return {
                    rpcUrl: ZG_RPC_ENDPOINT_TESTNET,
                    indexerUrl: INDEXER_URL_TESTNET_TURBO,
                }
            }
        } catch {
            // Fallback to testnet if network detection fails
            return {
                rpcUrl: ZG_RPC_ENDPOINT_TESTNET,
                indexerUrl: INDEXER_URL_TESTNET_TURBO,
            }
        }
    }
}
