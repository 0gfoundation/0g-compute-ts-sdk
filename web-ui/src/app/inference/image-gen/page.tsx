'use client'

import * as React from 'react'
import { useState, useCallback, useEffect, Suspense } from 'react'
import { useAccount } from 'wagmi'
import { use0GBroker } from '@/shared/hooks/use0GBroker'
import { useServiceProviders } from '../hooks/useServiceProviders'
import { useImageGeneration } from '@/shared/hooks/useImageGeneration'
import { StateDisplay } from '@/components/ui/state-display'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Download, Image as ImageIcon, Sparkles, Plus, History, Trash2, X } from 'lucide-react'
import { TopUpModal } from '../chat/components/TopUpModal'
import { Loader2 as LoaderIcon } from 'lucide-react'

function ImageGenContent() {
    const { isConnected } = useAccount()
    const { broker, isInitializing: brokerInitializing, ledgerInfo, refreshLedgerInfo } = use0GBroker()

    // Provider management for text-to-image services
    const {
        providers,
        selectedProvider,
        setSelectedProvider,
        serviceMetadata,
        providerBalance,
        providerBalanceNeuron,
        providerPendingRefund,
        isInitializing,
        error: providerError,
        refreshProviderBalance,
    } = useServiceProviders(broker, 'text-to-image')

    // Image generation hook
    const [generationError, setGenerationError] = useState<string | null>(null)
    const {
        isGenerating,
        currentImage,
        generatedImages,
        generateImage,
        stopGeneration,
        clearCurrentImage,
        loadHistory,
        clearHistory,
    } = useImageGeneration({
        broker,
        selectedProvider,
        serviceMetadata,
        onError: setGenerationError,
    })

    // UI state
    const [prompt, setPrompt] = useState('')
    const [imageSize, setImageSize] = useState('1024x1024')
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [isTopping, setIsTopping] = useState(false)

    // Load history on mount
    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    // Clear error after timeout
    useEffect(() => {
        if (generationError) {
            const timer = setTimeout(() => setGenerationError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [generationError])

    // Handle generate
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return

        // Check balance
        if (providerBalance === 0 || providerBalance === null) {
            setShowTopUpModal(true)
            return
        }

        await generateImage({ prompt, size: imageSize })
        // Refresh balance after generation
        refreshProviderBalance()
    }, [prompt, imageSize, generateImage, providerBalance, refreshProviderBalance])

    // Handle download
    const handleDownload = useCallback((imageData: string, filename: string) => {
        const link = document.createElement('a')
        link.href = imageData
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [])

    // Format balance
    const formatBalance = (balance: number | null) => {
        if (balance === null) return '...'
        return balance.toFixed(4)
    }

    // Wallet not connected
    if (!isConnected) {
        return (
            <div className="w-full">
                <StateDisplay
                    type="wallet-disconnected"
                    description="Please connect your wallet to generate images."
                />
            </div>
        )
    }

    const isLoading = brokerInitializing || isInitializing

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Image Generation</h1>
                        <p className="text-sm text-muted-foreground">
                            Create images from text prompts using decentralized AI
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {(providerError || generationError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {providerError || generationError}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <StateDisplay type="loading" />
            ) : providers.length === 0 ? (
                <StateDisplay
                    type="empty"
                    title="No Providers Available"
                    description="There are currently no text-to-image providers available. Please try again later."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Input */}
                    <div className="space-y-4">
                        {/* Provider Selector */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">Provider</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Balance:</span>
                                        <span className={`text-xs font-medium ${
                                            providerBalance === 0 ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                            {formatBalance(providerBalance)} 0G
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => setShowTopUpModal(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                                <Select
                                    value={selectedProvider?.address || ''}
                                    onValueChange={(value) => {
                                        const provider = providers.find(p => p.address === value)
                                        if (provider) setSelectedProvider(provider)
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.map((provider) => (
                                            <SelectItem key={provider.address} value={provider.address}>
                                                <div className="flex flex-col">
                                                    <span>{provider.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {provider.outputPrice?.toFixed(4) || '0'} 0G/image
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Prompt Input */}
                        <Card>
                            <CardContent className="p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prompt
                                </label>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the image you want to generate..."
                                    className="min-h-[120px] resize-none"
                                    disabled={isGenerating}
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Size:</label>
                                        <Select value={imageSize} onValueChange={setImageSize}>
                                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="512x512">512x512</SelectItem>
                                                <SelectItem value="1024x1024">1024x1024</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Est. cost: ~{selectedProvider?.outputPrice?.toFixed(4) || '0.003'} 0G
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Generate Button */}
                        <Button
                            variant="gradient"
                            className="w-full"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating || !selectedProvider}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Image
                                </>
                            )}
                        </Button>

                        {isGenerating && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={stopGeneration}
                            >
                                Cancel
                            </Button>
                        )}

                        {/* History Toggle */}
                        <Button
                            variant="ghost"
                            className="w-full text-gray-600"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <History className="h-4 w-4 mr-2" />
                            {showHistory ? 'Hide' : 'Show'} History ({generatedImages.length})
                        </Button>
                    </div>

                    {/* Right Column - Output */}
                    <div className="space-y-4">
                        {/* Current/Latest Image */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                {isGenerating ? (
                                    <div className="aspect-square flex items-center justify-center bg-secondary">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            </div>
                                            <p className="text-sm text-foreground font-medium">Generating your image...</p>
                                            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                                        </div>
                                    </div>
                                ) : currentImage ? (
                                    <div className="relative">
                                        <img
                                            src={currentImage.imageData}
                                            alt={currentImage.prompt}
                                            className="w-full aspect-square object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-white/90 hover:bg-white"
                                                onClick={() => handleDownload(
                                                    currentImage.imageData,
                                                    `generated-${currentImage.id}.png`
                                                )}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-white/90 hover:bg-white"
                                                onClick={clearCurrentImage}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                            <p className="text-white text-sm line-clamp-2">{currentImage.prompt}</p>
                                            <p className="text-white/70 text-xs mt-1">
                                                {currentImage.size} • {new Date(currentImage.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square flex items-center justify-center bg-secondary/50">
                                        <div className="text-center text-muted-foreground">
                                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                                                <ImageIcon className="h-8 w-8 opacity-50" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">Your image will appear here</p>
                                            <p className="text-xs mt-1">Enter a prompt and click Generate</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History Grid */}
                        {showHistory && generatedImages.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-700">Generation History</h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={clearHistory}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Clear
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                        {generatedImages.map((image) => (
                                            <button
                                                key={image.id}
                                                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                                onClick={() => {
                                                    // Set as current image for viewing
                                                    setPrompt(image.prompt)
                                                }}
                                            >
                                                <img
                                                    src={image.imageData}
                                                    alt={image.prompt}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Top Up Modal */}
            <TopUpModal
                isOpen={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
                broker={broker}
                selectedProvider={selectedProvider}
                topUpAmount={topUpAmount}
                setTopUpAmount={setTopUpAmount}
                isTopping={isTopping}
                setIsTopping={setIsTopping}
                providerBalance={providerBalance}
                providerPendingRefund={providerPendingRefund}
                ledgerInfo={ledgerInfo}
                refreshLedgerInfo={refreshLedgerInfo}
                refreshProviderBalance={refreshProviderBalance}
                setErrorWithTimeout={(err) => setGenerationError(err)}
            />
        </div>
    )
}

export default function ImageGenPage() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center p-8">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ImageGenContent />
        </Suspense>
    )
}
