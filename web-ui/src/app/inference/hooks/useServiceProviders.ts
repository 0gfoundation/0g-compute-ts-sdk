import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChainId } from 'wagmi'
import { transformBrokerServicesToProviders } from '../utils/providerTransform'
import { neuronToA0gi } from '../../../shared/utils/currency'
import type { Provider } from '../../../shared/types/broker'
import type { ZGComputeNetworkBroker, ZGComputeNetworkReadOnlyBroker } from '@0glabs/0g-serving-broker'

export type ServiceType = 'chatbot' | 'text-to-image' | 'speech-to-text' | 'image-editing'

interface ServiceMetadata {
    endpoint: string
    model: string
}

interface ServiceProvidersState {
    providers: Provider[]
    selectedProvider: Provider | null
    serviceMetadata: ServiceMetadata | null
    providerBalance: number | null
    providerBalanceNeuron: bigint | null
    providerPendingRefund: number | null
    isInitializing: boolean
    error: string | null
}

interface ServiceProvidersActions {
    setSelectedProvider: (provider: Provider | null) => void
    refreshProviderBalance: () => Promise<void>
    refreshProviders: () => Promise<void>
}

/**
 * Reusable hook for managing providers filtered by service type.
 * Works for chatbot, text-to-image, and speech-to-text services.
 */
export function useServiceProviders(
    broker: ZGComputeNetworkBroker | null,
    serviceType: ServiceType,
    readOnlyBroker?: ZGComputeNetworkReadOnlyBroker | null
): ServiceProvidersState & ServiceProvidersActions {
    const searchParams = useSearchParams()
    const chainId = useChainId()

    // Provider state
    const [providers, setProviders] = useState<Provider[]>([])
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
    const [serviceMetadata, setServiceMetadata] = useState<ServiceMetadata | null>(null)
    const [providerBalance, setProviderBalance] = useState<number | null>(null)
    const [providerBalanceNeuron, setProviderBalanceNeuron] = useState<bigint | null>(null)
    const [providerPendingRefund, setProviderPendingRefund] = useState<number | null>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Track current chainId to detect changes
    const [currentChainId, setCurrentChainId] = useState<number | undefined>(chainId)

    // Use broker if available, otherwise fall back to readOnlyBroker for listing
    const activeBroker = broker || readOnlyBroker

    // Reset all provider-related state when chain changes
    useEffect(() => {
        if (currentChainId !== undefined && chainId !== currentChainId) {
            // Clear all provider-related data
            setProviders([])
            setSelectedProvider(null)
            setServiceMetadata(null)
            setProviderBalance(null)
            setProviderBalanceNeuron(null)
            setProviderPendingRefund(null)
            setIsInitializing(true)
            setError(null)

            // Update tracked chain ID
            setCurrentChainId(chainId)
        } else if (currentChainId === undefined) {
            // Set initial chain ID
            setCurrentChainId(chainId)
        }
    }, [chainId, currentChainId])

    // Fetch providers list
    // TODO: Consider adding caching mechanism similar to OptimizedInferencePage
    // (2-minute TTL) to reduce redundant API calls across multiple page visits.
    // Current implementation refetches on every component mount.
    const fetchProviders = useCallback(async () => {
        if (!activeBroker) return

        setIsInitializing(true)
        setError(null)

        try {
            // Use the broker to get real service list
            const services = await activeBroker.inference.listService()

            // Transform services to Provider format
            const transformedProviders = transformBrokerServicesToProviders(services)

            // Debug: log service types to help identify available types
            console.log('[useServiceProviders] Available service types:',
                [...new Set(transformedProviders.map(p => p.serviceType))],
                'Looking for:', serviceType
            )

            // Filter by service type AND verified status
            // Use flexible matching for image services to handle various service type names
            const filteredProviders = transformedProviders.filter((p) => {
                if (!p.teeSignerAcknowledged) return false

                if (serviceType === 'text-to-image') {
                    // Match text-to-image services only, exclude image-editing
                    // Image editing requires file upload and uses /images/edits endpoint
                    if (p.serviceType === 'image-editing' ||
                        p.name?.toLowerCase().includes('edit')) {
                        return false
                    }
                    return p.serviceType === 'text-to-image' ||
                        p.name?.toLowerCase().includes('image')
                }

                if (serviceType === 'image-editing') {
                    // Match image-editing services
                    return p.serviceType === 'image-editing' ||
                        p.name?.toLowerCase().includes('edit')
                }

                return p.serviceType === serviceType
            })

            setProviders(filteredProviders)

            // Check for provider parameter from URL
            const providerParam = searchParams.get('provider')

            if (providerParam && !selectedProvider) {
                // Try to find the provider by address
                const targetProvider = filteredProviders.find(
                    (p) => p.address.toLowerCase() === providerParam.toLowerCase()
                )
                if (targetProvider) {
                    setSelectedProvider(targetProvider)
                } else if (filteredProviders.length > 0) {
                    // Fallback to first provider if specified provider not found
                    setSelectedProvider(filteredProviders[0])
                }
            } else if (!selectedProvider && filteredProviders.length > 0) {
                // Set the first provider as selected if none is selected
                setSelectedProvider(filteredProviders[0])
            }
        } catch (err: unknown) {
            console.error(`Failed to fetch ${serviceType} providers:`, err)

            // Provide context-specific error message
            if (!broker) {
                // Using readOnlyBroker but failed (user not connected)
                setError(`Failed to load providers. Please refresh the page or try connecting your wallet.`)
            } else {
                // Using authenticated broker but failed
                setError(`Failed to load providers. Please try again.`)
            }

            setProviders([])
            setSelectedProvider(null)
        } finally {
            setIsInitializing(false)
        }
    }, [activeBroker, serviceType, searchParams, selectedProvider, broker, readOnlyBroker])

    // Fetch providers on mount and when dependencies change
    useEffect(() => {
        fetchProviders()
    }, [fetchProviders])

    // Fetch service metadata when provider changes
    useEffect(() => {
        const fetchServiceMetadata = async () => {
            if (broker && selectedProvider) {
                try {
                    const metadata = await broker.inference.getServiceMetadata(
                        selectedProvider.address
                    )
                    if (metadata?.endpoint && metadata?.model) {
                        setServiceMetadata({
                            endpoint: metadata.endpoint,
                            model: metadata.model,
                        })
                    } else {
                        setServiceMetadata(null)
                    }
                } catch {
                    setServiceMetadata(null)
                }
            }
        }

        fetchServiceMetadata()
    }, [broker, selectedProvider])

    // Fetch provider balance
    const refreshProviderBalance = useCallback(async () => {
        if (broker && selectedProvider) {
            try {
                const account = await broker.inference.getAccount(
                    selectedProvider.address
                )
                if (account && account.balance) {
                    const balanceInA0gi = neuronToA0gi(
                        BigInt(account.balance) - BigInt(account.pendingRefund)
                    )
                    const pendingRefundInA0gi = neuronToA0gi(account.pendingRefund)
                    setProviderBalance(balanceInA0gi)
                    setProviderBalanceNeuron(account.balance)
                    setProviderPendingRefund(pendingRefundInA0gi)
                } else {
                    setProviderBalance(0)
                    setProviderBalanceNeuron(BigInt(0))
                    setProviderPendingRefund(0)
                }
            } catch {
                // Account doesn't exist yet or other error - set to 0
                setProviderBalance(0)
                setProviderBalanceNeuron(BigInt(0))
                setProviderPendingRefund(0)
            }
        } else if (!selectedProvider) {
            // Reset balance states when no provider is selected
            setProviderBalance(null)
            setProviderBalanceNeuron(null)
            setProviderPendingRefund(null)
        }
    }, [broker, selectedProvider])

    // Fetch balance when provider changes
    useEffect(() => {
        if (broker && selectedProvider) {
            refreshProviderBalance()
        } else {
            // Reset balance states when no provider selected
            setProviderBalance(null)
            setProviderBalanceNeuron(null)
            setProviderPendingRefund(null)
        }
    }, [broker, selectedProvider, refreshProviderBalance])

    return {
        // State
        providers,
        selectedProvider,
        serviceMetadata,
        providerBalance,
        providerBalanceNeuron,
        providerPendingRefund,
        isInitializing,
        error,
        // Actions
        setSelectedProvider,
        refreshProviderBalance,
        refreshProviders: fetchProviders,
    }
}
