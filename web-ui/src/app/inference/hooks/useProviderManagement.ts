import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChainId } from 'wagmi'
import { transformBrokerServicesToProviders } from '../utils/providerTransform'
import { neuronToA0gi } from '../../../shared/utils/currency'
import type { Provider } from '../../../shared/types/broker'

interface ServiceMetadata {
    endpoint: string
    model: string
}

interface ProviderManagementState {
    providers: Provider[]
    selectedProvider: Provider | null
    serviceMetadata: ServiceMetadata | null
    providerBalance: number | null
    providerBalanceNeuron: bigint | null
    providerPendingRefund: number | null
    isInitializing: boolean
}

interface ProviderManagementActions {
    setSelectedProvider: (provider: Provider | null) => void
    refreshProviderBalance: () => Promise<void>
}

export function useProviderManagement(
    broker: any // TODO: Replace with proper broker type when available
): ProviderManagementState & ProviderManagementActions {
    const searchParams = useSearchParams()
    const chainId = useChainId()

    // Provider state
    const [providers, setProviders] = useState<Provider[]>([])
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
        null
    )
    const [serviceMetadata, setServiceMetadata] =
        useState<ServiceMetadata | null>(null)
    const [providerBalance, setProviderBalance] = useState<number | null>(null)
    const [providerBalanceNeuron, setProviderBalanceNeuron] = useState<
        bigint | null
    >(null)
    const [providerPendingRefund, setProviderPendingRefund] = useState<
        number | null
    >(null)
    const [isInitializing, setIsInitializing] = useState(true)
    
    // Track current chainId to detect changes
    const [currentChainId, setCurrentChainId] = useState<number | undefined>(chainId)

    // Reset all provider-related state when chain changes
    useEffect(() => {
        if (currentChainId !== undefined && chainId !== currentChainId) {
            console.log('Provider management: Chain switched from', currentChainId, 'to', chainId)

            // Clear all provider-related data
            setProviders([])
            setSelectedProvider(null)
            setServiceMetadata(null)
            setProviderBalance(null)
            setProviderBalanceNeuron(null)
            setProviderPendingRefund(null)
            setIsInitializing(true)

            // Update tracked chain ID
            setCurrentChainId(chainId)
        } else if (currentChainId === undefined) {
            // Set initial chain ID
            setCurrentChainId(chainId)
        }
    }, [chainId, currentChainId])

    // Fetch providers list
    useEffect(() => {
        const fetchProviders = async () => {
            if (broker) {
                try {
                    // Use the broker to get real service list
                    const services = await broker.inference.listService()

                    // Transform services to Provider format
                    const transformedProviders =
                        transformBrokerServicesToProviders(services)

                    // Filter to only show chatbot providers (chat page only supports chatbot type)
                    const chatbotProviders = transformedProviders.filter(
                        (p) => p.serviceType === 'chatbot'
                    )

                    setProviders(chatbotProviders)

                    // Check for provider parameter from URL
                    const providerParam = searchParams.get('provider')

                    if (providerParam && !selectedProvider) {
                        // Try to find the provider by address (only from chatbot providers)
                        const targetProvider = chatbotProviders.find(
                            (p) =>
                                p.address.toLowerCase() ===
                                providerParam.toLowerCase()
                        )
                        if (targetProvider) {
                            setSelectedProvider(targetProvider)
                        } else if (chatbotProviders.length > 0) {
                            // Fallback to first chatbot provider if specified provider not found
                            setSelectedProvider(chatbotProviders[0])
                        }
                    } else if (
                        !selectedProvider &&
                        chatbotProviders.length > 0
                    ) {
                        // Set the first chatbot provider as selected if none is selected
                        setSelectedProvider(chatbotProviders[0])
                    }
                } catch (err: unknown) {
                    console.log('Failed to fetch providers from broker:', err)
                    // Fallback to empty array
                    setProviders([])
                    setSelectedProvider(null)
                }
            }
        }

        fetchProviders()
        setIsInitializing(false)
    }, [broker, selectedProvider, searchParams])

    // Fetch service metadata when provider changes
    useEffect(() => {
        const fetchServiceMetadata = async () => {
            if (broker && selectedProvider) {
                try {
                    // Step 5.1: Get the request metadata
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
    const refreshProviderBalance = async () => {
        if (broker && selectedProvider) {
            try {
                const account = await broker.inference.getAccount(
                    selectedProvider.address
                )
                if (account && account.balance) {
                    const balanceInA0gi = neuronToA0gi(
                        BigInt(account.balance) - BigInt(account.pendingRefund)
                    )
                    const pendingRefundInA0gi = neuronToA0gi(
                        account.pendingRefund
                    )
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
    }

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
    }, [broker, selectedProvider])

    return {
        // State
        providers,
        selectedProvider,
        serviceMetadata,
        providerBalance,
        providerBalanceNeuron,
        providerPendingRefund,
        isInitializing,
        // Actions
        setSelectedProvider,
        refreshProviderBalance,
    }
}
