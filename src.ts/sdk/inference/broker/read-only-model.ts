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
 * Model information returned by the provider's /v1/models endpoint
 */
export interface ProviderModelInfo {
    id: string
    object?: string
    created?: number
    owned_by?: string
    name?: string
    description?: string
    type?: string
    context_length?: number
    architecture?: {
        modality?: string
        input_modalities?: string[]
        output_modalities?: string[]
    }
    supported_parameters?: string[]
    pricing?: {
        prompt?: string
        completion?: string
    }
    verifiability?: string
    tee_attested?: boolean
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
}

/**
 * Read-only model processor for listing services and fetching health metrics
 * Works without authentication - only requires a read-only contract
 */
export class ReadOnlyModelProcessor {
    protected contract: ReadOnlyInferenceServingContract

    /** In-memory cache for /v1/models responses keyed by provider URL */
    private providerModelsCache: Map<
        string,
        { data: ProviderModelInfo[]; expiry: number }
    > = new Map()

    /** TTL for provider model info cache: 10 minutes */
    private readonly MODELS_CACHE_TTL = 10 * 60 * 1000

    constructor(contract: ReadOnlyInferenceServingContract) {
        this.contract = contract
    }

    /**
     * Fetch model list from a provider's /v1/models endpoint, with TTL caching.
     * Returns an empty array if the endpoint is unreachable or returns an error.
     */
    private async fetchProviderModels(
        providerUrl: string
    ): Promise<ProviderModelInfo[]> {
        const now = Date.now()
        const cached = this.providerModelsCache.get(providerUrl)
        if (cached && cached.expiry > now) {
            return cached.data
        }

        try {
            const baseUrl = providerUrl.replace(/\/$/, '')
            const response = await axios.get(`${baseUrl}/v1/models`, {
                timeout: 10000,
            })
            const models: ProviderModelInfo[] = response.data?.data ?? []
            this.providerModelsCache.set(providerUrl, {
                data: models,
                expiry: now + this.MODELS_CACHE_TTL,
            })
            return models
        } catch {
            return []
        }
    }

    /**
     * List services from the blockchain
     *
     * @param offset - Pagination offset (default: 0)
     * @param limit - Pagination limit (default: 50)
     * @param includeUnacknowledged - Include unacknowledged services (default: false)
     * @returns Array of service struct outputs
     */
    async listService(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        return this.contract.listService(offset, limit, includeUnacknowledged)
    }

    /**
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * @param offset - The offset for pagination (default: 0)
     * @param limit - The limit for pagination (default: 50)
     * @param includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false)
     * @returns Promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data
     * @throws An error if the service list cannot be retrieved or health API is unreachable
     *
     * @example
     * ```typescript
     * const servicesWithHealth = await processor.listServiceWithDetail();
     * servicesWithHealth.forEach(service => {
     *   console.log(`Provider: ${service.provider}`);
     *   if (service.healthMetrics) {
     *     console.log(`  Uptime: ${service.healthMetrics.uptime}%`);
     *     console.log(`  Latency: ${service.healthMetrics.avgResponseTime}ms`);
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
            // Get services from blockchain
            const services = await this.listService(
                offset,
                limit,
                includeUnacknowledged
            )

            // Determine health API endpoint based on chain ID
            const chainId = await this.contract.getChainId()
            const healthApiEndpoint = this.getHealthApiEndpoint(chainId)

            // Fetch health metrics from API
            let healthMetrics: ServiceHealthMetric[] = []
            try {
                const response = await axios.get(
                    `${healthApiEndpoint}/health`,
                    {
                        timeout: 10000, // 10 second timeout
                    }
                )
                healthMetrics = response.data.services || []
            } catch (error) {
                // Continue without health metrics if API fails
            }

            // Create a map of health metrics by provider address
            const healthMap = new Map<string, ServiceHealthMetric>()
            for (const metric of healthMetrics) {
                healthMap.set(metric.provider.toLowerCase(), metric)
            }

            // Fetch /v1/models from each unique provider URL (results are cached per-instance)
            const uniqueUrls = [...new Set(services.map((s) => s.url))]
            const urlToModels = new Map<string, ProviderModelInfo[]>()
            await Promise.all(
                uniqueUrls.map(async (url) => {
                    const models = await this.fetchProviderModels(url)
                    urlToModels.set(url, models)
                })
            )

            // Merge health metrics and model info with services
            // Note: Explicitly construct clean objects to avoid numeric indices from ethers Result type
            const servicesWithDetail: ServiceWithDetail[] = services.map(
                (service) => {
                    const health = healthMap.get(service.provider.toLowerCase())
                    const providerModels = urlToModels.get(service.url) ?? []
                    const modelInfo =
                        providerModels.find((m) => m.id === service.model) ??
                        (providerModels.length === 1
                            ? providerModels[0]
                            : undefined)
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
                    }
                }
            )

            return servicesWithDetail
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Get health API endpoint based on chain ID
     * @param chainId - The chain ID
     * @returns The health API endpoint URL
     */
    protected getHealthApiEndpoint(chainId?: bigint): string {
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
