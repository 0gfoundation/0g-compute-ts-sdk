'use client'

import * as React from 'react'
import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useAccount } from 'wagmi'
import { useBroker } from '@/shared/providers/BrokerProvider'
import { useServiceProviders } from '../hooks/useServiceProviders'
import { useImageEditing } from '@/shared/hooks/useImageEditing'
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
import { Loader2, Download, Image as ImageIcon, Wand2, Plus, History, Trash2, X, Upload } from 'lucide-react'
import { TopUpModal } from '../chat/components/TopUpModal'
import { formatNumber } from '@/shared/utils/formatNumber'

function ImageEditContent() {
    const { isConnected } = useAccount()
    const { broker, isInitializing: brokerInitializing, ledgerInfo, refreshLedgerInfo } = useBroker()

    // Provider management for image-editing services
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
    } = useServiceProviders(broker, 'image-editing')

    // Image editing hook
    const [editingError, setEditingError] = useState<string | null>(null)
    const {
        isEditing,
        currentImage,
        editedImages,
        editImage,
        stopEditing,
        clearCurrentImage,
        loadHistory,
        clearHistory,
    } = useImageEditing({
        broker,
        selectedProvider,
        serviceMetadata,
        onError: setEditingError,
    })

    // UI state
    const [prompt, setPrompt] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [isTopping, setIsTopping] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load history on mount
    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    // Clear error after timeout
    useEffect(() => {
        if (editingError) {
            const timer = setTimeout(() => setEditingError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [editingError])

    // Handle file selection
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setEditingError('Please select an image file')
                return
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setEditingError('Image file must be less than 10MB')
                return
            }
            setSelectedFile(file)
            // Create preview URL
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }, [])

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            if (file.size > 10 * 1024 * 1024) {
                setEditingError('Image file must be less than 10MB')
                return
            }
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
    }, [])

    // Clear selected file
    const clearFile = useCallback(() => {
        setSelectedFile(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [previewUrl])

    // Handle edit
    const handleEdit = useCallback(async () => {
        if (!prompt.trim() || !selectedFile) return

        // Check balance
        if (providerBalance === 0 || providerBalance === null) {
            setShowTopUpModal(true)
            return
        }

        await editImage({ image: selectedFile, prompt })
        // Refresh balance after editing
        refreshProviderBalance()
    }, [prompt, selectedFile, editImage, providerBalance, refreshProviderBalance])

    // Handle download
    const handleDownload = useCallback((imageData: string, filename: string) => {
        const link = document.createElement('a')
        link.href = imageData
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [])

    // Wallet not connected
    if (!isConnected) {
        return (
            <div className="w-full">
                <StateDisplay
                    type="wallet-disconnected"
                    description="Please connect your wallet to edit images."
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
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Image Editing</h1>
                        <p className="text-sm text-muted-foreground">
                            Edit images with AI using decentralized providers
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {(providerError || editingError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {providerError || editingError}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <StateDisplay type="loading" />
            ) : providers.length === 0 ? (
                <StateDisplay
                    type="empty"
                    title="No Providers Available"
                    description="There are currently no image-editing providers available. Please try again later."
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
                                            {providerBalance !== null ? formatNumber(providerBalance) : '...'} 0G
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
                                                        {provider.outputPrice?.toFixed(4) || '0'} 0G/edit
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Image Upload */}
                        <Card>
                            <CardContent className="p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Source Image
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {!selectedFile ? (
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                        <p className="text-sm text-gray-600 mb-1">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG, WEBP up to 10MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={previewUrl || ''}
                                            alt="Preview"
                                            className="w-full h-48 object-contain rounded-lg bg-gray-100"
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                            onClick={clearFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-2 truncate">
                                            {selectedFile.name}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Prompt Input */}
                        <Card>
                            <CardContent className="p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Edit Instructions
                                </label>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe how you want to edit the image..."
                                    className="min-h-[100px] resize-none"
                                    disabled={isEditing}
                                />
                                <div className="text-xs text-gray-500 mt-2">
                                    Est. cost: ~{selectedProvider?.outputPrice?.toFixed(4) || '0.05'} 0G
                                </div>
                            </CardContent>
                        </Card>

                        {/* Edit Button */}
                        <Button
                            variant="gradient"
                            className="w-full"
                            size="lg"
                            onClick={handleEdit}
                            disabled={!prompt.trim() || !selectedFile || isEditing || !selectedProvider}
                        >
                            {isEditing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Editing...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Edit Image
                                </>
                            )}
                        </Button>

                        {isEditing && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={stopEditing}
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
                            {showHistory ? 'Hide' : 'Show'} History ({editedImages.length})
                        </Button>
                    </div>

                    {/* Right Column - Output */}
                    <div className="space-y-4">
                        {/* Current/Latest Image */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                {isEditing ? (
                                    <div className="aspect-square flex items-center justify-center bg-secondary">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            </div>
                                            <p className="text-sm text-foreground font-medium">Editing your image...</p>
                                            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                                        </div>
                                    </div>
                                ) : currentImage ? (
                                    <div className="relative">
                                        <div className="grid grid-cols-2 gap-1">
                                            <div className="relative">
                                                <img
                                                    src={currentImage.originalImage}
                                                    alt="Original"
                                                    className="w-full aspect-square object-cover"
                                                />
                                                <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                    Original
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <img
                                                    src={currentImage.editedImage}
                                                    alt="Edited"
                                                    className="w-full aspect-square object-cover"
                                                />
                                                <span className="absolute top-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded">
                                                    Edited
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-white/90 hover:bg-white"
                                                onClick={() => handleDownload(
                                                    currentImage.editedImage,
                                                    `edited-${currentImage.id}.png`
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
                                        <div className="bg-gradient-to-t from-black/70 to-transparent p-4">
                                            <p className="text-white text-sm line-clamp-2">{currentImage.prompt}</p>
                                            <p className="text-white/70 text-xs mt-1">
                                                {new Date(currentImage.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square flex items-center justify-center bg-secondary/50">
                                        <div className="text-center text-muted-foreground">
                                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                                                <Wand2 className="h-8 w-8 opacity-50" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">Your edited image will appear here</p>
                                            <p className="text-xs mt-1">Upload an image and describe your edits</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History Grid */}
                        {showHistory && editedImages.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-700">Edit History</h3>
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
                                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                        {editedImages.map((image) => (
                                            <button
                                                key={image.id}
                                                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                                onClick={() => {
                                                    setPrompt(image.prompt)
                                                }}
                                            >
                                                <img
                                                    src={image.editedImage}
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
                setErrorWithTimeout={(err) => setEditingError(err)}
            />
        </div>
    )
}

export default function ImageEditPage() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ImageEditContent />
        </Suspense>
    )
}
