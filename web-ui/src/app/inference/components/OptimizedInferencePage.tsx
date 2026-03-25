'use client'

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { useChainId } from 'wagmi'
import { useBroker } from '@/shared/providers/BrokerProvider'
import { useOptimizedDataFetching } from '@/shared/hooks/useOptimizedDataFetching'
import type { Provider, ModelSummary } from '@/shared/types/broker'
import { OFFICIAL_PROVIDERS } from '../constants/providers'
import { transformBrokerServicesToProviders } from '../utils/providerTransform'
import { aggregateProvidersByModel } from '../utils/modelAggregation'
import { useNavigation } from '@/shared/components/navigation/OptimizedNavigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StateDisplay, NoticeBar } from '@/components/ui/state-display'
import { ProviderCard } from './ProviderCard'
import { ModelCard } from './ModelCard'
import { BuildDrawer } from './BuildDrawer'
import { ProviderFilters, type VerificationFilter, type SortOption } from './ProviderFilters'
import { ModelFilters, type ModelServiceTypeFilter } from './ModelFilters'
import { Cpu, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const getRecentlyUsedProviders = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem('recentlyUsedProviders')
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

const getSelectedModelFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('model')
}

export function OptimizedInferencePage() {
    const chainId = useChainId()
    const { broker, readOnlyBroker, isInitializing } = useBroker()
    const { setIsNavigating, setTargetRoute, setTargetPageType } = useNavigation()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedProviderForBuild, setSelectedProviderForBuild] =
        useState<Provider | null>(null)

    // Read ?model param from URL
    const [selectedModel, setSelectedModel] = useState<string | null>(getSelectedModelFromUrl)

    // Model list filter state
    const [modelSearchQuery, setModelSearchQuery] = useState('')
    const [modelServiceTypeFilter, setModelServiceTypeFilter] = useState<ModelServiceTypeFilter>('all')

    // Provider list filter state (when viewing a specific model's providers)
    const [providerSearchQuery, setProviderSearchQuery] = useState('')
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
    const [sortOption, setSortOption] = useState<SortOption>('name-asc')

    // Optimized providers data fetching with chain awareness
    const activeBroker = broker || readOnlyBroker
    const {
        data: providers,
        loading: providersLoading,
        error: providersError,
    } = useOptimizedDataFetching<Provider[]>({
        fetchFn: async () => {
            if (!activeBroker) throw new Error('Broker not available')

            try {
                const services = await activeBroker.inference.listService()
                return transformBrokerServicesToProviders(services)
            } catch {
                return []
            }
        },
        cacheKey: 'inference-providers',
        cacheTTL: 2 * 60 * 1000,
        dependencies: [activeBroker],
        skip: !activeBroker,
        chainId,
    })

    // Aggregate providers into model summaries
    const allModelSummaries = useMemo(() => {
        return aggregateProvidersByModel(providers || [])
    }, [providers])

    // Filter model summaries
    const filteredModels = useMemo(() => {
        let result = allModelSummaries

        if (modelSearchQuery.trim()) {
            const query = modelSearchQuery.toLowerCase()
            result = result.filter(
                (m) =>
                    m.displayName.toLowerCase().includes(query) ||
                    m.model.toLowerCase().includes(query)
            )
        }

        if (modelServiceTypeFilter !== 'all') {
            result = result.filter((m) => m.serviceType === modelServiceTypeFilter)
        }

        return result
    }, [allModelSummaries, modelSearchQuery, modelServiceTypeFilter])

    // Get providers for the selected model
    const selectedModelProviders = useMemo(() => {
        if (!selectedModel || !providers) return []
        return providers.filter((p) => p.model === selectedModel)
    }, [selectedModel, providers])

    // Find display name for the selected model
    const selectedModelDisplayName = useMemo(() => {
        if (!selectedModel) return ''
        const summary = allModelSummaries.find((m) => m.model === selectedModel)
        return summary?.displayName || selectedModel
    }, [selectedModel, allModelSummaries])

    // Filter and sort providers for the selected model view
    const filteredAndSortedProviders = useMemo(() => {
        let result = selectedModelProviders

        if (providerSearchQuery.trim()) {
            const query = providerSearchQuery.toLowerCase()
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.address.toLowerCase().includes(query)
            )
        }

        if (verificationFilter === 'verified') {
            result = result.filter((p) => p.teeSignerAcknowledged === true)
        } else if (verificationFilter === 'unverified') {
            result = result.filter((p) => p.teeSignerAcknowledged !== true)
        }

        // Helper to calculate total price
        const getTotalPrice = (p: Provider) => (p.inputPrice || 0) + (p.outputPrice || 0)

        const recentlyUsed = getRecentlyUsedProviders()
        result = [...result].sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'price-asc':
                    return getTotalPrice(a) - getTotalPrice(b)
                case 'price-desc':
                    return getTotalPrice(b) - getTotalPrice(a)
                case 'recently-used': {
                    const indexA = recentlyUsed.indexOf(a.address)
                    const indexB = recentlyUsed.indexOf(b.address)
                    if (indexA === -1 && indexB === -1) return 0
                    if (indexA === -1) return 1
                    if (indexB === -1) return -1
                    return indexA - indexB
                }
                default:
                    return 0
            }
        })

        return result
    }, [selectedModelProviders, providerSearchQuery, verificationFilter, sortOption])

    const recentlyUsedSet = new Set(getRecentlyUsedProviders())

    const cheapestProviderAddress = useMemo(() => {
        if (!filteredAndSortedProviders.length) return null

        let cheapest: Provider | null = null
        let minPrice = Infinity

        for (const provider of filteredAndSortedProviders) {
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

    // Navigation handlers
    const handleModelClick = useCallback((model: ModelSummary) => {
        const url = `/inference?model=${encodeURIComponent(model.model)}`
        setSelectedModel(model.model)
        setProviderSearchQuery('')
        setVerificationFilter('all')
        setSortOption('name-asc')
        window.history.pushState({}, '', url)
    }, [])

    const handleBackToModels = useCallback(() => {
        setSelectedModel(null)
        window.history.pushState({}, '', '/inference')
    }, [])

    // Listen to browser back/forward
    React.useEffect(() => {
        const handlePopState = () => {
            setSelectedModel(getSelectedModelFromUrl())
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

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

    const handleImageEditWithProvider = useCallback(
        (provider: Provider) => {
            const editUrl = `/inference/image-edit?provider=${encodeURIComponent(provider.address)}`
            setIsNavigating(true)
            setTargetRoute('Image Editing')
            setTargetPageType('image-edit')
            setTimeout(() => {
                window.location.href = editUrl
            }, 50)
        },
        [setIsNavigating, setTargetRoute, setTargetPageType]
    )

    const isLoading = isInitializing && !readOnlyBroker
    const allProviders = providers || []
    const hasError = providersError && !providers

    return (
        <TooltipProvider>
            <div className="w-full">
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
                ) : selectedModel ? (
                    // ===== Provider List View (filtered by model) =====
                    <>
                        {/* Breadcrumb / Back navigation */}
                        <div className="mb-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
                                onClick={handleBackToModels}
                            >
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                All Models
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {selectedModelDisplayName}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedModelProviders.length} provider{selectedModelProviders.length !== 1 ? 's' : ''} available
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Provider filters (without service type since already filtered by model) */}
                        <ProviderFilters
                            searchQuery={providerSearchQuery}
                            onSearchChange={setProviderSearchQuery}
                            verificationFilter={verificationFilter}
                            onVerificationFilterChange={setVerificationFilter}
                            hideServiceType
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            resultCount={filteredAndSortedProviders.length}
                            totalCount={selectedModelProviders.length}
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
                                        onImageEdit={handleImageEditWithProvider}
                                        onSpeechToText={handleSpeechToTextWithProvider}
                                    />
                                )
                            })}
                        </div>

                        {/* Empty state */}
                        {filteredAndSortedProviders.length === 0 && selectedModelProviders.length > 0 && (
                            <StateDisplay
                                type="empty"
                                title="No Matching Providers"
                                description="No providers match your search or filter criteria. Try adjusting your filters."
                            />
                        )}

                        {selectedModelProviders.length === 0 && (
                            <StateDisplay
                                type="empty"
                                title="No Providers Found"
                                description="No providers are currently offering this model. Try going back to browse other models."
                            />
                        )}
                    </>
                ) : (
                    // ===== Model List View =====
                    <>
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-foreground">AI Models</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Browse available models and choose a provider
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Model filters */}
                        <ModelFilters
                            searchQuery={modelSearchQuery}
                            onSearchChange={setModelSearchQuery}
                            serviceTypeFilter={modelServiceTypeFilter}
                            onServiceTypeFilterChange={setModelServiceTypeFilter}
                            resultCount={filteredModels.length}
                            totalCount={allModelSummaries.length}
                        />

                        {/* Model cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredModels.map((model) => (
                                <ModelCard
                                    key={model.model}
                                    model={model}
                                    onClick={handleModelClick}
                                />
                            ))}
                        </div>

                        {/* Empty states */}
                        {filteredModels.length === 0 && allModelSummaries.length > 0 && (
                            <StateDisplay
                                type="empty"
                                title="No Matching Models"
                                description="No models match your search or filter criteria. Try adjusting your filters."
                            />
                        )}

                        {allProviders.length === 0 && !isLoading && (
                            <StateDisplay
                                type="empty"
                                title="No Models Available"
                                description="There are currently no AI models available. Please try again later."
                            />
                        )}
                    </>
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
