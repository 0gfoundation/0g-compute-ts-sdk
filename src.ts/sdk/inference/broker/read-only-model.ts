import type { ServiceStructOutput } from '../contract'
import type { ReadOnlyInferenceServingContract } from '../contract'
import { throwFormattedError } from '../../common/utils'
import axios from 'axios'

export enum VerifiabilityEnum {
    OpML = 'OpML',
    TeeML = 'TeeML',
    ZKML = 'ZKML',
}

export type Verifiability =
    | VerifiabilityEnum.OpML
    | VerifiabilityEnum.TeeML
    | VerifiabilityEnum.ZKML

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

export interface ServiceHealthMetric {
    serviceType: string
    model: string
    provider: string
    status: HealthStatus
    checks: {
        total: number
        successful: number
        failed: number
        uptime: number
    }
    performance: {
        response_time?: {
            avg: number
            unit: string
            samples: number
        }
        ttft?: {
            avg: number
            unit: string
            samples: number
        }
        tokens_per_second?: {
            avg: number
            unit: string
            samples: number
        }
    }
    lastCheck: string
}

/**
 * Model information returned by the status API's /v1/models endpoint
 */
export interface ProviderModelInfo {
    id: string
    provider?: string
    object?: string
    created?: number
    owned_by?: string
    name?: string
    description?: string
    type?: string
    context_length?: number
    max_completion_tokens?: number
    architecture?: {
        modality?: string
        input_modalities?: string[]
        output_modalities?: string[]
        /** Instruction format the model expects, e.g. "none" | "alpaca" | "chatml" */
        instruct_type?: string
        tokenizer?: string
    }
    supported_parameters?: string[]
    /** Default parameter values to use when constructing requests */
    default_parameters?: {
        temperature?: number
        top_p?: number
        top_k?: number
        [key: string]: number | string | boolean | undefined
    }
    pricing?: {
        prompt?: string
        completion?: string
        /** Price per generated image (text-to-image services) */
        image?: string
    }
    /** ISO 8601 date string indicating when this model will no longer be served */
    expiration_date?: string
    verifiability?: string
    tee_attested?: boolean
    tee_type?: string
    tee_verifier?: string
}

/**
 * Service information with optional health metrics and provider model info
 */
export interface ServiceWithDetail {
    provider: string
    serviceType: string
    url: string
    inputPrice: bigint
    outputPrice: bigint
    updatedAt: bigint
    model: string
    verifiability: string
    additionalInfo: string
    teeSignerAddress: string
    teeSignerAcknowledged: boolean
    healthMetrics?: {
        status: string
        uptime: number
        avgResponseTime: number
        lastCheck: string
    }
    modelInfo?: ProviderModelInfo
    /** All models served by this provider (populated for multi-model centralized providers) */
    allModels?: ProviderModelInfo[]
}

/**
 * Read-only model processor for listing services and fetching health metrics
 * Works without authentication - only requires a read-only contract
 */
export class ReadOnlyModelProcessor {
    protected contract: ReadOnlyInferenceServingContract

    constructor(contract: ReadOnlyInferenceServingContract) {
        this.contract = contract
    }

    /**
     * List services enriched with health metrics, model info, and multi-model pricing.
     *
     * This method combines on-chain service data with real-time status API data
     * to provide complete service information including per-model pricing for
     * multi-model centralized providers.
     *
     * @param offset - Pagination offset (default: 0)
     * @param limit - Pagination limit (default: 50)
     * @param includeUnacknowledged - Include unacknowledged services (default: false)
     * @returns Array of ServiceWithDetail objects
     */
    async listService(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceWithDetail[]> {
        return this.listServiceWithDetail(offset, limit, includeUnacknowledged)
    }

    /**
     * List raw services from the blockchain without enrichment.
     * Used internally by listServiceWithDetail.
     */
    async listServiceRaw(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        return this.contract.listService(offset, limit, includeUnacknowledged)
    }

    /**
     * Retrieves a list of services enriched with health metrics and model info from the status API.
     *
     * @param offset - The offset for pagination (default: 0)
     * @param limit - The limit for pagination (default: 50)
     * @param includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false)
     * @returns Promise that resolves to an array of ServiceWithDetail objects, each containing:
     *   - Blockchain service data (provider, model, pricing, verifiability, etc.)
     *   - `healthMetrics` — uptime, avg response time, and status (omitted if unavailable)
     *   - `modelInfo` — rich model metadata: context length, max completion tokens, tokenizer,
     *     TEE attestation details, supported parameters, pricing, and more (omitted if unavailable)
     * @throws An error if the service list cannot be retrieved
     *
     * @example
     * ```typescript
     * const services = await processor.listServiceWithDetail();
     * services.forEach(service => {
     *   console.log(`Provider: ${service.provider}`);
     *   if (service.healthMetrics) {
     *     console.log(`  Uptime: ${service.healthMetrics.uptime}%`);
     *     console.log(`  Latency: ${service.healthMetrics.avgResponseTime}ms`);
     *   }
     *   if (service.modelInfo) {
     *     console.log(`  Model: ${service.modelInfo.name}`);
     *     console.log(`  Context: ${service.modelInfo.context_length} tokens`);
     *     console.log(`  TEE Attested: ${service.modelInfo.tee_attested}`);
     *   }
     * });
     * ```
     */
    async listServiceWithDetail(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceWithDetail[]> {
        try {
            // Get raw services from blockchain
            const services = await this.listServiceRaw(
                offset,
                limit,
                includeUnacknowledged
            )

            // Determine status API endpoint based on chain ID
            const chainId = await this.contract.getChainId()
            const statusApiEndpoint = this.getStatusApiEndpoint(chainId)

            // Fetch health metrics and aggregated model info from status API in parallel
            let healthMetrics: ServiceHealthMetric[] = []
            let allModels: ProviderModelInfo[] = []
            await Promise.all([
                axios
                    .get(`${statusApiEndpoint}/health`, { timeout: 10000 })
                    .then((r) => {
                        healthMetrics = Array.isArray(r.data?.services)
                            ? r.data.services
                            : []
                    })
                    .catch(() => {}),
                axios
                    .get(`${statusApiEndpoint}/models`, { timeout: 10000 })
                    .then((r) => {
                        allModels = Array.isArray(r.data?.data)
                            ? r.data.data
                            : []
                    })
                    .catch(() => {}),
            ])

            // Create a map of health metrics by provider address
            const healthMap = new Map<string, ServiceHealthMetric>()
            for (const metric of healthMetrics) {
                healthMap.set(metric.provider.toLowerCase(), metric)
            }

            // Create a map of model info by provider address
            const providerModelsMap = new Map<string, ProviderModelInfo[]>()
            for (const model of allModels) {
                if (!model.provider) continue
                const key = model.provider.toLowerCase()
                const list = providerModelsMap.get(key) ?? []
                list.push(model)
                providerModelsMap.set(key, list)
            }

            // Merge health metrics and model info with services
            // Note: Explicitly construct clean objects to avoid numeric indices from ethers Result type
            const servicesWithDetail: ServiceWithDetail[] = services.map(
                (service) => {
                    const health = healthMap.get(service.provider.toLowerCase())
                    const providerModels =
                        providerModelsMap.get(service.provider.toLowerCase()) ??
                        []
                    const modelInfo = providerModels.find(
                        (m) => m.id === service.model
                    )
                    // For multi-model providers, include all models with pricing
                    const allModels =
                        providerModels.length > 1
                            ? providerModels
                            : undefined
                    return {
                        provider: service.provider,
                        serviceType: service.serviceType,
                        url: service.url,
                        inputPrice: service.inputPrice,
                        outputPrice: service.outputPrice,
                        updatedAt: service.updatedAt,
                        model: service.model,
                        verifiability: service.verifiability,
                        additionalInfo: service.additionalInfo,
                        teeSignerAddress: service.teeSignerAddress,
                        teeSignerAcknowledged: service.teeSignerAcknowledged,
                        healthMetrics: health
                            ? {
                                status: health.status,
                                uptime: health.checks.uptime,
                                avgResponseTime:
                                    health.performance.response_time?.avg ?? 0,
                                lastCheck: health.lastCheck,
                            }
                            : undefined,
                        modelInfo,
                        allModels,
                    }
                }
            )

            return servicesWithDetail
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Get status API endpoint based on chain ID
     * @param chainId - The chain ID
     * @returns The status API endpoint URL
     */
    protected getStatusApiEndpoint(chainId?: bigint): string {
        // Mainnet: 16661n, Testnet: 16602n
        if (chainId === 16661n) {
            return 'https://compute-status.0g.ai'
        } else {
            // Default to testnet
            return 'https://compute-status-testnet.0g.ai'
        }
    }
}

export function isVerifiability(value: string): value is Verifiability {
    return Object.values(VerifiabilityEnum).includes(value as VerifiabilityEnum)
}
