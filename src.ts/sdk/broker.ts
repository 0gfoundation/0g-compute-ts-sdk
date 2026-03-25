import type { JsonRpcSigner } from 'ethers'
import { Wallet, JsonRpcProvider } from 'ethers'
import { createLedgerBroker } from './ledger'
import { createFineTuningBroker } from './fine-tuning/broker'
import { createInferenceBroker } from './inference/broker/broker'
import type { InferenceBroker } from './inference/broker/broker'
import type { LedgerBroker } from './ledger'
import type { FineTuningBroker } from './fine-tuning/broker'
import { createReadOnlyInferenceBroker } from './inference/broker/read-only-broker'
import type { ReadOnlyInferenceBroker } from './inference/broker/read-only-broker'
import { createReadOnlyFineTuningBroker } from './fine-tuning/broker/read-only-broker'
import type { ReadOnlyFineTuningBroker } from './fine-tuning/broker/read-only-broker'
import {
    TESTNET_CHAIN_ID,
    MAINNET_CHAIN_ID,
    HARDHAT_CHAIN_ID,
    CONTRACT_ADDRESSES,
    isDevMode,
    getNetworkType,
} from './constants'

// Re-export constants for backward compatibility
export {
    TESTNET_CHAIN_ID,
    MAINNET_CHAIN_ID,
    HARDHAT_CHAIN_ID,
    CONTRACT_ADDRESSES,
    isDevMode,
    getNetworkType,
}

export class ZGComputeNetworkBroker {
    public ledger!: LedgerBroker
    public inference!: InferenceBroker
    public fineTuning?: FineTuningBroker

    constructor(
        ledger: LedgerBroker,
        inferenceBroker: InferenceBroker,
        fineTuningBroker?: FineTuningBroker
    ) {
        this.ledger = ledger
        this.inference = inferenceBroker
        this.fineTuning = fineTuningBroker
    }
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
export async function createZGComputeNetworkBroker(
    signer: JsonRpcSigner | Wallet,
    ledgerCA?: string,
    inferenceCA?: string,
    fineTuningCA?: string,
    gasPrice?: number,
    maxGasPrice?: number,
    step?: number
): Promise<ZGComputeNetworkBroker> {
    try {
        // Auto-detect network from signer's provider
        let defaultAddresses: {
            ledger: string
            inference: string
            fineTuning: string
        } = CONTRACT_ADDRESSES.testnet // Default to testnet

        if (signer.provider) {
            const network = await signer.provider.getNetwork()
            const chainId = network.chainId

            if (chainId === MAINNET_CHAIN_ID) {
                defaultAddresses = CONTRACT_ADDRESSES.mainnet
                console.log(`Detected mainnet (chain ID: ${chainId})`)
            } else if (chainId === TESTNET_CHAIN_ID) {
                if (isDevMode()) {
                    defaultAddresses = CONTRACT_ADDRESSES.testnetDev
                    console.log(
                        `Detected testnet [DEV MODE] (chain ID: ${chainId})`
                    )
                } else {
                    defaultAddresses = CONTRACT_ADDRESSES.testnet
                    console.log(`Detected testnet (chain ID: ${chainId})`)
                }
            } else if (chainId === HARDHAT_CHAIN_ID) {
                defaultAddresses = CONTRACT_ADDRESSES.hardhat
                console.log(`Detected hardhat (chain ID: ${chainId})`)
            } else {
                console.warn(
                    `Unknown chain ID: ${chainId}. Using testnet addresses as default.`
                )
            }
        } else {
            console.warn(
                'No provider found on signer. Using testnet addresses as default.'
            )
        }

        // Use provided addresses or fall back to auto-detected defaults
        const finalLedgerCA = ledgerCA || defaultAddresses.ledger
        const finalInferenceCA = inferenceCA || defaultAddresses.inference
        const finalFineTuningCA = fineTuningCA || defaultAddresses.fineTuning

        const ledger = await createLedgerBroker(
            signer,
            finalLedgerCA,
            finalInferenceCA,
            finalFineTuningCA,
            gasPrice,
            maxGasPrice,
            step
        )
        const inferenceBroker = await createInferenceBroker(
            signer,
            finalInferenceCA,
            ledger
        )

        let fineTuningBroker: FineTuningBroker | undefined
        if (signer instanceof Wallet) {
            fineTuningBroker = await createFineTuningBroker(
                signer,
                finalFineTuningCA,
                ledger,
                gasPrice,
                maxGasPrice,
                step
            )
        }

        const broker = new ZGComputeNetworkBroker(
            ledger,
            inferenceBroker,
            fineTuningBroker
        )
        return broker
    } catch (error) {
        throw error
    }
}

/**
 * Read-only version of ZGComputeNetworkBroker that doesn't require wallet connection.
 * Provides access to public blockchain data without authentication.
 *
 * Use this broker to:
 * - Browse available AI providers before connecting wallet
 * - Fetch service information and pricing
 * - Get provider health metrics
 *
 * Limitations:
 * - Cannot perform authenticated operations (send requests, manage accounts, etc.)
 * - No ledger services (require authentication)
 * - Read-only operations only
 */
export class ZGComputeNetworkReadOnlyBroker {
    public inference!: ReadOnlyInferenceBroker
    public fineTuning!: ReadOnlyFineTuningBroker

    constructor(inferenceBroker: ReadOnlyInferenceBroker, fineTuningBroker: ReadOnlyFineTuningBroker) {
        this.inference = inferenceBroker
        this.fineTuning = fineTuningBroker
    }
}

/**
 * createZGComputeNetworkReadOnlyBroker creates a read-only broker WITHOUT wallet connection
 *
 * This broker provides access to public blockchain data (e.g., list providers) without
 * requiring user authentication. Perfect for browsing services before connecting a wallet.
 *
 * @param rpcUrl - JSON-RPC endpoint URL (e.g., 'https://evmrpc-testnet.0g.ai')
 * @param chainId - Optional chain ID. If not provided, will be detected from RPC endpoint.
 *
 * @returns Read-only broker instance with inference.listService() and inference.listServiceWithDetail()
 *
 * @example
 * ```typescript
 * // Create read-only broker (no wallet needed!)
 * const broker = await createZGComputeNetworkReadOnlyBroker(
 *   'https://evmrpc-testnet.0g.ai'
 * );
 *
 * // List all available providers (no authentication required)
 * const providers = await broker.inference.listService();
 * console.log(`Found ${providers.length} providers`);
 *
 * // Get detailed provider info with health metrics
 * const providersWithHealth = await broker.inference.listServiceWithDetail();
 * providersWithHealth.forEach(p => {
 *   console.log(`${p.provider}: ${p.healthMetrics?.uptime}% uptime`);
 * });
 * ```
 *
 * @throws An error if the broker cannot be initialized.
 */
export async function createZGComputeNetworkReadOnlyBroker(
    rpcUrl: string,
    chainId?: number
): Promise<ZGComputeNetworkReadOnlyBroker> {
    try {
        // Create provider to detect network if chainId not provided
        let detectedChainId = chainId
        if (!detectedChainId) {
            const provider = new JsonRpcProvider(rpcUrl)
            const network = await provider.getNetwork()
            detectedChainId = Number(network.chainId)
        }

        // Log detected network for debugging
        const chainIdBigInt = BigInt(detectedChainId)
        if (chainIdBigInt === MAINNET_CHAIN_ID) {
            console.log(`Detected mainnet (chain ID: ${detectedChainId})`)
        } else if (chainIdBigInt === TESTNET_CHAIN_ID) {
            if (isDevMode()) {
                console.log(
                    `Detected testnet [DEV MODE] (chain ID: ${detectedChainId})`
                )
            } else {
                console.log(`Detected testnet (chain ID: ${detectedChainId})`)
            }
        } else if (chainIdBigInt === HARDHAT_CHAIN_ID) {
            console.log(`Detected hardhat (chain ID: ${detectedChainId})`)
        } else {
            console.warn(
                `Unknown chain ID: ${detectedChainId}. Using testnet addresses as default.`
            )
        }

        // Create read-only brokers (no authentication!)
        // The brokers will auto-detect contract addresses based on chainId
        const inferenceBroker = await createReadOnlyInferenceBroker(
            rpcUrl,
            detectedChainId
        )
        const fineTuningBroker = await createReadOnlyFineTuningBroker(
            rpcUrl,
            detectedChainId
        )

        const broker = new ZGComputeNetworkReadOnlyBroker(inferenceBroker, fineTuningBroker)
        return broker
    } catch (error) {
        throw error
    }
}
