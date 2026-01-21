'use client'

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
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
import { ProviderFilters, type VerificationFilter, type ServiceTypeFilter, type SortOption } from './ProviderFilters'
import { Cpu } from 'lucide-react'

// Helper to get recently used providers from localStorage
const getRecentlyUsedProviders = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem('recentlyUsedProviders')
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export function OptimizedInferencePage() {
    const { isConnected } = useAccount()
    const chainId = useChainId()
    const { broker, isInitializing } = use0GBroker()
    const { setIsNavigating, setTargetRoute, setTargetPageType } = useNavigation()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedProviderForBuild, setSelectedProviderForBuild] =
        useState<Provider | null>(null)

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('')
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
    const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilter>('all')
    const [sortOption, setSortOption] = useState<SortOption>('name-asc')

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

    // Navigate to image generation page
    const handleImageGenWithProvider = useCallback(
        (provider: Provider) => {
            const imageGenUrl = `/inference/image-gen?provider=${encodeURIComponent(provider.address)}`
            setIsNavigating(true)
            setTargetRoute('Image Generation')
            setTargetPageType('image-gen')
            setTimeout(() => {
                window.location.href = imageGenUrl
            }, 50)
        },
        [setIsNavigating, setTargetRoute, setTargetPageType]
    )

    // Navigate to speech-to-text page
    const handleSpeechToTextWithProvider = useCallback(
        (provider: Provider) => {
            const sttUrl = `/inference/speech-to-text?provider=${encodeURIComponent(provider.address)}`
            setIsNavigating(true)
            setTargetRoute('Speech to Text')
            setTargetPageType('speech-to-text')
            setTimeout(() => {
                window.location.href = sttUrl
            }, 50)
        },
        [setIsNavigating, setTargetRoute, setTargetPageType]
    )

    // Filter and sort providers
    const filteredAndSortedProviders = useMemo(() => {
        let result = providers || []

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.address.toLowerCase().includes(query) ||
                    p.model?.toLowerCase().includes(query)
            )
        }

        // Verification filter
        if (verificationFilter === 'verified') {
            result = result.filter((p) => p.teeSignerAcknowledged === true)
        } else if (verificationFilter === 'unverified') {
            result = result.filter((p) => p.teeSignerAcknowledged !== true)
        }

        // Service type filter
        if (serviceTypeFilter !== 'all') {
            result = result.filter((p) => p.serviceType === serviceTypeFilter)
        }

        // Sort
        const recentlyUsed = getRecentlyUsedProviders()
        result = [...result].sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'price-asc':
                    const priceA = (a.inputPrice || 0) + (a.outputPrice || 0)
                    const priceB = (b.inputPrice || 0) + (b.outputPrice || 0)
                    return priceA - priceB
                case 'price-desc':
                    const priceA2 = (a.inputPrice || 0) + (a.outputPrice || 0)
                    const priceB2 = (b.inputPrice || 0) + (b.outputPrice || 0)
                    return priceB2 - priceA2
                case 'recently-used':
                    const indexA = recentlyUsed.indexOf(a.address)
                    const indexB = recentlyUsed.indexOf(b.address)
                    // Providers in recently used list come first
                    if (indexA === -1 && indexB === -1) return 0
                    if (indexA === -1) return 1
                    if (indexB === -1) return -1
                    return indexA - indexB
                default:
                    return 0
            }
        })

        return result
    }, [providers, searchQuery, verificationFilter, serviceTypeFilter, sortOption])

    // Recently used providers set for quick lookup
    const recentlyUsedSet = useMemo(() => {
        const used = getRecentlyUsedProviders()
        return new Set(used)
    }, [])

    // Find the cheapest provider (by total input + output price)
    const cheapestProviderAddress = useMemo(() => {
        if (!filteredAndSortedProviders.length) return null

        let cheapest: Provider | null = null
        let minPrice = Infinity

        for (const provider of filteredAndSortedProviders) {
            // Only consider providers with pricing info
            if (provider.inputPrice !== undefined || provider.outputPrice !== undefined) {
                const totalPrice = (provider.inputPrice || 0) + (provider.outputPrice || 0)
                if (totalPrice < minPrice) {
                    minPrice = totalPrice
                    cheapest = provider
                }
            }
        }

        return cheapest?.address || null
    }, [filteredAndSortedProviders])

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
    const allProviders = providers || []
    const hasError = providersError && !providers

    return (
        <TooltipProvider>
            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">AI Providers</h1>
                            <p className="text-sm text-muted-foreground">
                                Choose from decentralized providers to access AI services
                            </p>
                        </div>
                    </div>
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
                        {/* Filters */}
                        <ProviderFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            verificationFilter={verificationFilter}
                            onVerificationFilterChange={setVerificationFilter}
                            serviceTypeFilter={serviceTypeFilter}
                            onServiceTypeFilterChange={setServiceTypeFilter}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            resultCount={filteredAndSortedProviders.length}
                            totalCount={allProviders.length}
                        />

                        {/* Provider cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredAndSortedProviders.map((provider) => {
                                const isOfficial = OFFICIAL_PROVIDERS.some(
                                    (op) => op.address === provider.address
                                )
                                const isRecentlyUsed = recentlyUsedSet.has(provider.address)
                                const isCheapest = cheapestProviderAddress === provider.address

                                return (
                                    <ProviderCard
                                        key={provider.address}
                                        provider={provider}
                                        isOfficial={isOfficial}
                                        isLoading={providersLoading}
                                        isRecentlyUsed={isRecentlyUsed}
                                        isCheapest={isCheapest}
                                        onChat={handleChatWithProvider}
                                        onBuild={handleBuildWithProvider}
                                        onImageGen={handleImageGenWithProvider}
                                        onSpeechToText={handleSpeechToTextWithProvider}
                                    />
                                )
                            })}
                        </div>

                        {/* Empty state after filtering */}
                        {filteredAndSortedProviders.length === 0 && allProviders.length > 0 && (
                            <StateDisplay
                                type="empty"
                                title="No Matching Providers"
                                description="No providers match your search or filter criteria. Try adjusting your filters."
                            />
                        )}
                    </>
                )}

                {/* Empty state when no providers at all */}
                {!isLoading && allProviders.length === 0 && (
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
