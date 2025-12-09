'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { use0GBroker } from '@/shared/hooks/use0GBroker'
import { useOptimizedDataFetching } from '@/shared/hooks/useOptimizedDataFetching'
import type { Provider } from '@/shared/types/broker'
import { OFFICIAL_PROVIDERS } from '../constants/providers'
import { transformBrokerServicesToProviders } from '../utils/providerTransform'
import { useNavigation } from '@/shared/components/navigation/OptimizedNavigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StateDisplay, NoticeBar } from '@/components/ui/state-display'
import { ProviderCard } from './ProviderCard'
import { BuildDrawer } from './BuildDrawer'

export function OptimizedInferencePage() {
    const { isConnected } = useAccount()
    const chainId = useChainId()
    const { broker, isInitializing } = use0GBroker()
    const { setIsNavigating, setTargetRoute, setTargetPageType } = useNavigation()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedProviderForBuild, setSelectedProviderForBuild] =
        useState<Provider | null>(null)

    // Optimized providers data fetching with chain awareness
    const {
        data: providers,
        loading: providersLoading,
        error: providersError,
    } = useOptimizedDataFetching<Provider[]>({
        fetchFn: async () => {
            if (!broker) throw new Error('Broker not available')

            try {
                const services = await broker.inference.listService()
                return transformBrokerServicesToProviders(services)
            } catch {
                return []
            }
        },
        cacheKey: 'inference-providers',
        cacheTTL: 2 * 60 * 1000, // 2 minutes cache
        dependencies: [broker],
        skip: !broker,
        chainId,
    })

    // Use native navigation instead of Next.js router to avoid RSC .txt navigation issues in static export
    const handleChatWithProvider = useCallback(
        (provider: Provider) => {
            const chatUrl = `/inference/chat?provider=${encodeURIComponent(provider.address)}`
            setIsNavigating(true)
            setTargetRoute('Chat')
            setTargetPageType('chat')
            setTimeout(() => {
                window.location.href = chatUrl
            }, 50)
        },
        [setIsNavigating, setTargetRoute, setTargetPageType]
    )

    const handleBuildWithProvider = useCallback((provider: Provider) => {
        setSelectedProviderForBuild(provider)
        setIsDrawerOpen(true)
    }, [])

    const handleCloseDrawer = useCallback(() => {
        setIsDrawerOpen(false)
        setSelectedProviderForBuild(null)
    }, [])

    // Wallet not connected state
    if (!isConnected) {
        return (
            <div className="w-full">
                <StateDisplay
                    type="wallet-disconnected"
                    description="Please connect your wallet to access AI inference features."
                />
            </div>
        )
    }

    const isLoading = isInitializing
    const displayProviders = providers || []
    const hasError = providersError && !providers

    return (
        <TooltipProvider>
            <div className="w-full">
                {/* Header */}
                <div className="mb-3">
                    <h1 className="text-lg font-semibold text-gray-900">Inference</h1>
                    <p className="text-xs text-gray-500">
                        Choose from decentralized AI providers to start chatting or
                        integrate the service into your own application
                    </p>
                </div>

                {/* Error notice */}
                {hasError && (
                    <NoticeBar
                        variant="warning"
                        title="Notice"
                        description="Failed to fetch live provider data. Showing fallback providers."
                    />
                )}

                {/* Loading state */}
                {isLoading ? (
                    <StateDisplay type="loading" />
                ) : (
                    <>
                        {/* Provider cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayProviders.map((provider) => {
                                const isOfficial = OFFICIAL_PROVIDERS.some(
                                    (op) => op.address === provider.address
                                )

                                return (
                                    <ProviderCard
                                        key={provider.address}
                                        provider={provider}
                                        isOfficial={isOfficial}
                                        isLoading={providersLoading}
                                        onChat={handleChatWithProvider}
                                        onBuild={handleBuildWithProvider}
                                    />
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Empty state */}
                {!isLoading && displayProviders.length === 0 && (
                    <StateDisplay
                        type="empty"
                        title="No Providers Available"
                        description="There are currently no AI inference providers available. Please try again later."
                    />
                )}

                {/* Build drawer */}
                <BuildDrawer
                    provider={selectedProviderForBuild}
                    isOpen={isDrawerOpen}
                    onClose={handleCloseDrawer}
                />
            </div>
        </TooltipProvider>
    )
}

export default OptimizedInferencePage
