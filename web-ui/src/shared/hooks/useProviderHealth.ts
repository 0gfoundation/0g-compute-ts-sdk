import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import useSWR from 'swr'

/**
 * Health status from the compute-status API
 */
export interface ProviderHealthStatus {
    serviceType: string
    model: string
    provider: string
    status: 'healthy' | 'warning' | 'critical'
    checks: {
        total: number
        successful: number
        failed: number
        uptime: number
    }
    performance: {
        response_time: {
            avg: number
            p50: number
            p90: number
            p95: number
            p99: number
            min: number
            max: number
            unit: string
            samples: number
        }
        ttft?: {
            avg: number
            p50: number
            p90: number
            p95: number
            p99: number
            min: number
            max: number
            unit: string
            samples: number
        }
        tokens_per_second?: {
            avg: number
            p50: number
            p90: number
            p95: number
            p99: number
            min: number
            max: number
            unit: string
            samples: number
        }
    }
    lastCheck: string
}

export interface HealthCheckResponse {
    status: string
    timestamp: string
    isMonitoring: boolean
    summary: {
        totalServices: number
        healthy: number
        warning: number
        critical: number
        overallUptime: number
    }
    services: ProviderHealthStatus[]
}

interface UseProviderHealthReturn {
    healthData: Map<string, ProviderHealthStatus[]> // Map of provider address to their services
    isLoading: boolean
    error: string | null
    lastUpdated: Date | null
    refresh: () => Promise<void>
}

// Health check API endpoints
const HEALTH_CHECK_URLS = {
    mainnet: 'https://compute-status.0g.ai/health',
    testnet: 'https://compute-status-testnet.0g.ai/health',
}

// 0G Network Chain IDs
const CHAIN_IDS = {
    mainnet: 16661, // 0G Mainnet
    testnet: 16602, // 0G Testnet (Newton)
}

/**
 * Get health check API URL based on chain ID
 */
function getHealthCheckUrl(chainId: number | undefined): string {
    if (chainId === CHAIN_IDS.mainnet) {
        return HEALTH_CHECK_URLS.mainnet
    }
    return HEALTH_CHECK_URLS.testnet
}

/**
 * Fetcher function for SWR
 */
async function fetcher(url: string): Promise<HealthCheckResponse> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        cache: 'no-cache',
    })

    if (!response.ok) {
        throw new Error(`Health check API returned ${response.status}`)
    }

    return response.json()
}

/**
 * Transform health response services to a Map for O(1) lookups
 */
function transformToMap(services: ProviderHealthStatus[]): Map<string, ProviderHealthStatus[]> {
    const healthMap = new Map<string, ProviderHealthStatus[]>()

    services.forEach((service) => {
        const address = service.provider.toLowerCase()
        const existing = healthMap.get(address) || []
        healthMap.set(address, [...existing, service])
    })

    return healthMap
}

/**
 * Hook to fetch and manage provider health status from the compute-status API
 *
 * @remarks
 * This hook uses SWR for efficient data fetching and caching. It automatically
 * fetches health data from the appropriate compute-status API based on the
 * current network:
 * - Mainnet (16661): https://compute-status.0g.ai/health
 * - Testnet (16602): https://compute-status-testnet.0g.ai/health
 *
 * Features:
 * - Automatic caching across all components using the same hook
 * - Request deduplication (multiple components = single fetch)
 * - Network-aware (switches endpoint when network changes)
 *
 * @example
 * ```tsx
 * const { healthData, isLoading, refresh } = useProviderHealth()
 *
 * // Get health status for a specific provider
 * const providerHealth = healthData.get(providerAddress.toLowerCase())
 * const isHealthy = providerHealth?.every(s => s.status === 'healthy') ?? true
 *
 * // Manually refresh health data
 * <button onClick={refresh}>Refresh</button>
 * ```
 */
export function useProviderHealth(): UseProviderHealthReturn {
    const chainId = useChainId()
    const healthCheckUrl = getHealthCheckUrl(chainId)

    // Use SWR for data fetching with caching
    const { data, error, isLoading, mutate } = useSWR<HealthCheckResponse>(
        healthCheckUrl,
        fetcher,
        {
            revalidateOnFocus: false,     // Don't auto-refresh when window gains focus
            revalidateOnReconnect: false, // Don't auto-refresh on reconnect
            refreshInterval: 0,           // No automatic polling
            dedupingInterval: 60000,      // Dedupe requests within 60 seconds
            shouldRetryOnError: true,     // Retry on error
            errorRetryCount: 3,           // Retry up to 3 times
            errorRetryInterval: 5000,     // Wait 5 seconds between retries
        }
    )

    // Transform services array to Map for efficient lookups
    const healthData = useMemo(() => {
        if (!data?.services) {
            return new Map<string, ProviderHealthStatus[]>()
        }
        return transformToMap(data.services)
    }, [data?.services])

    // Get last updated timestamp from data
    const lastUpdated = useMemo(() => {
        if (data?.timestamp) {
            return new Date(data.timestamp)
        }
        return null
    }, [data?.timestamp])

    // Manual refresh function
    const refresh = async () => {
        await mutate()
    }

    return {
        healthData,
        isLoading,
        error: error ? (error.message || 'Failed to fetch health data') : null,
        lastUpdated,
        refresh,
    }
}

/**
 * Get health status for a specific model/service
 *
 * @param healthData - Health data map from useProviderHealth hook
 * @param providerAddress - Provider address to check
 * @param modelName - Model name to check (optional - if not provided, returns unknown)
 * @returns Health status object for the specific model
 */
export function getModelHealthStatus(
    healthData: Map<string, ProviderHealthStatus[]>,
    providerAddress: string,
    modelName?: string
): {
    isHealthy: boolean
    status: 'healthy' | 'warning' | 'critical' | 'unknown'
    uptime: number | null
    serviceInfo: ProviderHealthStatus | null
} {
    const address = providerAddress.toLowerCase()
    const providerServices = healthData.get(address) || []

    // If no model name provided or no services found, return unknown
    if (!modelName || providerServices.length === 0) {
        return {
            isHealthy: false, // Default to unhealthy if no data
            status: 'unknown',
            uptime: null,
            serviceInfo: null,
        }
    }

    // Find the specific service matching this model
    // Try exact match first, then partial match (for cases like "qwen/qwen2.5" vs "qwen2.5")
    const normalizedModel = modelName.toLowerCase()
    let service = providerServices.find(s => s.model.toLowerCase() === normalizedModel)

    if (!service) {
        // Try partial match - check if model name contains the service model or vice versa
        service = providerServices.find(s => {
            const serviceModel = s.model.toLowerCase()
            return normalizedModel.includes(serviceModel) || serviceModel.includes(normalizedModel)
        })
    }

    // If no matching service found, return unknown
    if (!service) {
        return {
            isHealthy: false,
            status: 'unknown',
            uptime: null,
            serviceInfo: null,
        }
    }

    // Return the specific service's health status
    return {
        isHealthy: service.status === 'healthy',
        status: service.status,
        uptime: service.checks.uptime,
        serviceInfo: service,
    }
}

/**
 * Get Tailwind CSS classes for health status indicator
 *
 * @param status - Health status
 * @returns Tailwind CSS classes for the status dot
 */
export function getHealthStatusColor(
    status: 'healthy' | 'warning' | 'critical' | 'unknown'
): string {
    switch (status) {
        case 'critical':
            return 'bg-red-500 animate-pulse'
        case 'warning':
        case 'unknown':
            return 'bg-yellow-500 animate-pulse'
        case 'healthy':
        default:
            return 'bg-green-500'
    }
}

/**
 * Get human-readable text for health status
 *
 * @param status - Health status
 * @returns Human-readable status text
 */
export function getHealthStatusText(
    status: 'healthy' | 'warning' | 'critical' | 'unknown'
): string {
    switch (status) {
        case 'critical':
            return 'Service Degraded'
        case 'warning':
            return 'Limited Availability'
        case 'unknown':
            return 'Status Unknown'
        case 'healthy':
        default:
            return 'High Availability'
    }
}
