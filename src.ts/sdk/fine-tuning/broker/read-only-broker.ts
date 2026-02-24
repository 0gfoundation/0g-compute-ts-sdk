import type { JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers'
import { JsonRpcProvider as JsonRpcProviderClass } from 'ethers'
import { FineTuningServing__factory } from '../contract/typechain'
import type { ServiceStructOutput } from '../contract'
import { ReadOnlyServiceProcessor } from './read-only-service'
import { ReadOnlyModelProcessor } from './read-only-model'
import { CONTRACT_ADDRESSES, TESTNET_CHAIN_ID, MAINNET_CHAIN_ID, HARDHAT_CHAIN_ID, isDevMode } from '../../constants'

/**
 * Read-only fine-tuning broker with operations that don't require authentication.
 * Can be used with a Provider (read-only) without wallet connection.
 *
 * Use this broker to:
 * - List available fine-tuning providers before connecting wallet
 * - List available models without authentication
 * - Browse services without authentication
 */
export class ReadOnlyFineTuningBroker {
    protected serviceProcessor: ReadOnlyServiceProcessor
    protected modelProcessor: ReadOnlyModelProcessor

    constructor(
        provider: JsonRpcProvider | JsonRpcSigner | Wallet,
        contractAddress: string
    ) {
        const serving = FineTuningServing__factory.connect(
            contractAddress,
            provider
        )
        this.serviceProcessor = new ReadOnlyServiceProcessor(serving)
        this.modelProcessor = new ReadOnlyModelProcessor(serving)
    }

    /**
     * Retrieves a list of fine-tuning services from the contract.
     * This is a read-only operation that doesn't require authentication.
     *
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceStructOutput[]>} A promise that resolves to an array of ServiceStructOutput objects.
     * @throws An error if the service list cannot be retrieved.
     */
    public async listService(
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        return this.serviceProcessor.listService(includeUnacknowledged)
    }

    /**
     * List all available models including both standard pre-trained models
     * and customized models from providers.
     * This is a read-only operation that doesn't require authentication.
     *
     * @returns A tuple containing two arrays:
     *   - [0]: Standard pre-trained models with their configurations
     *   - [1]: Customized models from providers with descriptions
     */
    public async listModel(): Promise<[string, { [key: string]: string }][][]> {
        return this.modelProcessor.listModel()
    }
}

/**
 * Factory function to create a read-only fine-tuning broker.
 * No authentication required - perfect for listing providers without wallet connection.
 *
 * @param rpcUrl - JSON-RPC endpoint URL (e.g., https://evmrpc-testnet.0g.ai)
 * @param chainId - Optional chain ID (auto-detected if not provided)
 * @returns Read-only fine-tuning broker instance
 */
export async function createReadOnlyFineTuningBroker(
    rpcUrl: string,
    chainId?: number
): Promise<ReadOnlyFineTuningBroker> {
    const provider = new JsonRpcProviderClass(rpcUrl)

    const detectedChainId = chainId ?? Number((await provider.getNetwork()).chainId)

    let fineTuningCA: string

    if (detectedChainId === Number(MAINNET_CHAIN_ID)) {
        fineTuningCA = CONTRACT_ADDRESSES.mainnet.fineTuning
    } else if (detectedChainId === Number(TESTNET_CHAIN_ID)) {
        fineTuningCA = isDevMode()
            ? CONTRACT_ADDRESSES.testnetDev.fineTuning
            : CONTRACT_ADDRESSES.testnet.fineTuning
    } else if (detectedChainId === Number(HARDHAT_CHAIN_ID)) {
        fineTuningCA = CONTRACT_ADDRESSES.hardhat.fineTuning
    } else {
        fineTuningCA = CONTRACT_ADDRESSES.testnet.fineTuning
    }

    return new ReadOnlyFineTuningBroker(provider, fineTuningCA)
}
