import type { ServiceStructOutput } from '../contract'
import { ZGServingUserBrokerBase } from './base'
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

export interface ServiceHealthMetric {
    serviceType: string
    model: string
    provider: string
    status: string
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

// Plain object interface without array indices (ethers Result types don't spread well)
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
}

export class ModelProcessor extends ZGServingUserBrokerBase {
    async listService(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        try {
            const services = await this.contract.listService(
                offset,
                limit,
                includeUnacknowledged
            )
            return services
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceWithDetail[]>} A promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data.
     * @throws An error if the service list cannot be retrieved or health API is unreachable.
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
            const chainId = await this.contract.signer.provider
                ?.getNetwork()
                .then((n) => n.chainId)
            const healthApiEndpoint = this.getHealthApiEndpoint(chainId)

            // Fetch health metrics from API
            let healthMetrics: ServiceHealthMetric[] = []
            try {
                const response = await axios.get(
                    `${healthApiEndpoint}/health`,
                    {
                        timeout: 5000, // 5 second timeout
                    }
                )
                healthMetrics = response.data.services || []
            } catch (error) {
                console.warn('Failed to fetch health metrics:', error)
                // Continue without health metrics
            }

            // Create a map of health metrics by provider address
            const healthMap = new Map<string, ServiceHealthMetric>()
            for (const metric of healthMetrics) {
                healthMap.set(metric.provider.toLowerCase(), metric)
            }

            // Merge health metrics with services
            // Note: Cannot use spread operator on ethers Result objects as it loses named properties
            const servicesWithDetail: ServiceWithDetail[] = services.map(
                (service) => {
                    const health = healthMap.get(service.provider.toLowerCase())
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
    private getHealthApiEndpoint(chainId?: bigint): string {
        // Mainnet: 16661n, Testnet: 16602n
        if (chainId === 16661n) {
            return 'https://compute-status.0g.ai'
        } else {
            // Default to testnet
            return 'https://compute-status-testnet.0g.ai'
        }
    }

    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    async removeService(gasPrice?: number): Promise<void> {
        try {
            const txOptions: any = {}
            if (gasPrice) {
                txOptions.gasPrice = gasPrice
            }

            await this.contract.sendTx('removeService', [], txOptions)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Update service (Provider owner only)
     *
     * This function allows the provider owner to update their existing service.
     * All parameters are optional - if not provided, the current value is preserved.
     *
     * @param options - Update options
     * @param options.url - New service URL
     * @param options.model - New model name
     * @param options.inputPrice - New input price (in neuron, the smallest unit)
     * @param options.outputPrice - New output price (in neuron, the smallest unit)
     * @param options.gasPrice - Optional gas price for the transaction
     * @throws Will throw an error if the caller is not the service owner or if update fails.
     */
    async updateService(options: {
        url?: string
        model?: string
        inputPrice?: bigint
        outputPrice?: bigint
        gasPrice?: number
    }): Promise<void> {
        try {
            // Get current service to preserve unchanged fields
            const userAddress = this.contract.getUserAddress()
            const currentService = await this.contract.getService(userAddress)

            if (!currentService || !currentService.provider) {
                throw new Error('Service not found for the current provider')
            }

            // Build ServiceParams with updated values (use new value if provided, otherwise keep current)
            const params = {
                serviceType: currentService.serviceType,
                url: options.url ?? currentService.url,
                model: options.model ?? currentService.model,
                verifiability: currentService.verifiability,
                inputPrice: options.inputPrice ?? currentService.inputPrice,
                outputPrice: options.outputPrice ?? currentService.outputPrice,
                additionalInfo: currentService.additionalInfo,
                teeSignerAddress: currentService.teeSignerAddress,
            }

            const txOptions: { gasPrice?: number } = {}
            if (options.gasPrice) {
                txOptions.gasPrice = options.gasPrice
            }

            await this.contract.sendTx(
                'addOrUpdateService',
                [params],
                txOptions
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
}

export function isVerifiability(value: string): value is Verifiability {
    return Object.values(VerifiabilityEnum).includes(value as VerifiabilityEnum)
}
