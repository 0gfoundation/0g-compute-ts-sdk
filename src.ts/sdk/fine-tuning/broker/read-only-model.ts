import type { FineTuningServing } from '../contract/typechain/FineTuningServing'
import { throwFormattedError } from '../../common/utils'
import { getNetworkType, isDevMode } from '../../constants'
import {
    TESTNET_MODELS,
    TESTNET_DEV_MODELS,
    MAINNET_MODELS,
    HARDHAT_MODELS,
} from '../const'

/**
 * Read-only model processor for listing fine-tuning models.
 * Works without authentication - only requires a provider-connected contract.
 */
export class ReadOnlyModelProcessor {
    protected serving: FineTuningServing

    constructor(serving: FineTuningServing) {
        this.serving = serving
    }

    /**
     * List all available models including both standard pre-trained models
     * and customized models from providers.
     *
     * Network-specific models:
     * - Testnet (dev mode): Qwen2.5-0.5B-Instruct
     * - Testnet (production): Qwen2.5-0.5B-Instruct
     * - Mainnet: Qwen2.5-0.5B-Instruct, Qwen3-32B
     * - Hardhat (local): mock-model
     *
     * @returns A tuple containing two arrays:
     *   - [0]: Standard pre-trained models with their configurations
     *   - [1]: Customized models from providers with descriptions
     *
     * @example
     * ```typescript
     * const [standardModels, customizedModels] = await broker.fineTuning.listModel();
     *
     * // Standard models: [['Qwen2.5-0.5B-Instruct', {...}], ...]
     * // Customized models: [['my-model', { description: '...', provider: '0x...' }], ...]
     * ```
     */
    async listModel(): Promise<[string, { [key: string]: string }][][]> {
        try {
            const chainId = await this.serving.runner?.provider
                ?.getNetwork()
                .then((n) => n.chainId)
            const networkType = chainId ? getNetworkType(chainId) : 'unknown'
            const devMode = isDevMode()

            let modelConfig
            if (networkType === 'hardhat') {
                modelConfig = HARDHAT_MODELS
            } else if (networkType === 'testnet') {
                modelConfig = devMode ? TESTNET_DEV_MODELS : TESTNET_MODELS
            } else if (networkType === 'mainnet') {
                modelConfig = MAINNET_MODELS
            } else {
                modelConfig = MAINNET_MODELS
            }

            const availableModels = Object.entries(modelConfig)

            const services = await this.serving.getAllServices()
            const customizedModels: [string, { [key: string]: string }][] = []

            for (const service of services) {
                if (service.models.length !== 0) {
                    try {
                        const endpoint = `${service.url}/v1/model`
                        const response = await fetch(endpoint, { method: 'GET' })
                        if (response.ok) {
                            const models = await response.json() as { name: string; description: string }[]
                            for (const item of models) {
                                customizedModels.push([
                                    item.name,
                                    {
                                        description: item.description,
                                        provider: service.provider,
                                    },
                                ])
                            }
                        }
                    } catch {
                        // Skip providers that are unreachable
                    }
                }
            }

            return [availableModels, customizedModels]
        } catch (error) {
            throwFormattedError(error)
        }
    }
}
