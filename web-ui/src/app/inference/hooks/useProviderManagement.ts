import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChainId } from 'wagmi'
import type { ZGComputeNetworkBroker, ZGComputeNetworkReadOnlyBroker } from '@0glabs/0g-serving-broker'
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
    broker: ZGComputeNetworkBroker | null,
    readOnlyBroker?: ZGComputeNetworkReadOnlyBroker | null
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

    // Fetch providers list (use full broker if available, otherwise readOnlyBroker)
    const activeBroker = broker || readOnlyBroker
    useEffect(() => {
        let cancelled = false

        const fetchProviders = async () => {
            if (activeBroker) {
                try {
                    const services = await activeBroker.inference.listServiceWithDetail()

                    if (cancelled) return

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
                        const targetProvider = chatbotProviders.find(
                            (p) =>
                                p.address.toLowerCase() ===
                                providerParam.toLowerCase()
                        )
                        if (targetProvider) {
                            setSelectedProvider(targetProvider)
                        } else if (chatbotProviders.length > 0) {
                            setSelectedProvider(chatbotProviders[0])
                        }
                    } else if (
                        !selectedProvider &&
                        chatbotProviders.length > 0
                    ) {
                        setSelectedProvider(chatbotProviders[0])
                    }
                } catch (err: unknown) {
                    if (cancelled) return
                    console.log('Failed to fetch providers from broker:', err)
                    setProviders([])
                    setSelectedProvider(null)
                } finally {
                    if (!cancelled) setIsInitializing(false)
                }
            } else {
                setIsInitializing(false)
            }
        }

        fetchProviders()

        return () => { cancelled = true }
    }, [activeBroker, selectedProvider, searchParams])

    // Fetch service metadata when provider changes
    useEffect(() => {
        let cancelled = false

        const fetchServiceMetadata = async () => {
            if (broker && selectedProvider) {
                try {
                    const metadata = await broker.inference.getServiceMetadata(
                        selectedProvider.address
                    )
                    if (cancelled) return
                    if (metadata?.endpoint && metadata?.model) {
                        setServiceMetadata({
                            endpoint: metadata.endpoint,
                            model: metadata.model,
                        })
                    } else {
                        setServiceMetadata(null)
                    }
                } catch {
                    if (cancelled) return
                    setServiceMetadata(null)
                }
            }
        }

        fetchServiceMetadata()

        return () => { cancelled = true }
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
                setProviderBalance(0)
                setProviderBalanceNeuron(BigInt(0))
                setProviderPendingRefund(0)
            }
        } else if (!selectedProvider) {
            setProviderBalance(null)
            setProviderBalanceNeuron(null)
            setProviderPendingRefund(null)
        }
    }, [broker, selectedProvider])

    // Fetch balance when provider changes
    useEffect(() => {
        refreshProviderBalance()
    }, [refreshProviderBalance])

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
