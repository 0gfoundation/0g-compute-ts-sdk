import type { ServiceStructOutput } from '../contract';
import { ZGServingUserBrokerBase } from './base';
export declare enum VerifiabilityEnum {
    OpML = "OpML",
    TeeML = "TeeML",
    ZKML = "ZKML"
}
export type Verifiability = VerifiabilityEnum.OpML | VerifiabilityEnum.TeeML | VerifiabilityEnum.ZKML;
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export interface ServiceHealthMetric {
    serviceType: string;
    model: string;
    provider: string;
    status: HealthStatus;
    checks: {
        total: number;
        successful: number;
        failed: number;
        uptime: number;
    };
    performance: {
        response_time?: {
            avg: number;
            unit: string;
            samples: number;
        };
        ttft?: {
            avg: number;
            unit: string;
            samples: number;
        };
        tokens_per_second?: {
            avg: number;
            unit: string;
            samples: number;
        };
    };
    lastCheck: string;
}
export interface ServiceWithDetail {
    provider: string;
    serviceType: string;
    url: string;
    inputPrice: bigint;
    outputPrice: bigint;
    updatedAt: bigint;
    model: string;
    verifiability: string;
    additionalInfo: string;
    teeSignerAddress: string;
    teeSignerAcknowledged: boolean;
    healthMetrics?: {
        status: string;
        uptime: number;
        avgResponseTime: number;
        lastCheck: string;
    };
}
export declare class ModelProcessor extends ZGServingUserBrokerBase {
    listService(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceStructOutput[]>;
    /**
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceWithDetail[]>} A promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data.
     * @throws An error if the service list cannot be retrieved or health API is unreachable.
     */
    listServiceWithDetail(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceWithDetail[]>;
    /**
     * Get health API endpoint based on chain ID
     * @param chainId - The chain ID
     * @returns The health API endpoint URL
     */
    private getHealthApiEndpoint;
    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    removeService(gasPrice?: number): Promise<void>;
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
    updateService(options: {
        url?: string;
        model?: string;
        inputPrice?: bigint;
        outputPrice?: bigint;
        gasPrice?: number;
    }): Promise<void>;
}
export declare function isVerifiability(value: string): value is Verifiability;
//# sourceMappingURL=model.d.ts.map