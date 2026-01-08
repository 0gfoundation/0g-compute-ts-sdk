'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Copy,
    AlertCircle,
    Loader2,
    MessageSquare,
    Image as ImageIcon,
    Mic,
    Check,
} from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Provider } from '@/shared/types/broker'

interface ProviderCardProps {
    provider: Provider
    isOfficial: boolean
    isLoading?: boolean
    onClick?: (provider: Provider) => void // Changed: single click handler for the entire card
}

export function ProviderCard({
    provider,
    isOfficial,
    isLoading = false,
    onClick,
}: ProviderCardProps) {
    const { toast } = useToast()
    const [isCopied, setIsCopied] = React.useState(false)
    const isVerified = provider.teeSignerAcknowledged ?? false
    const isDisabled = !isVerified

    const copyAddress = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click when copying address
        const success = await copyToClipboard(provider.address)
        if (success) {
            setIsCopied(true)
            toast({
                title: 'Address copied',
                description: 'Provider address copied to clipboard',
                duration: 2000,
            })
            setTimeout(() => setIsCopied(false), 2000)
        }
    }

    const truncatedAddress = `${provider.address.slice(0, 8)}...${provider.address.slice(-6)}`

    const handleCardClick = () => {
        if (!isDisabled && onClick) {
            onClick(provider)
        }
    }

    // Determine model type icon based on service type
    const getModelTypeIcon = () => {
        const serviceType = provider.serviceType
        if (serviceType === 'text-to-image' || serviceType === 'image-editing') {
            return <ImageIcon className="h-4 w-4 text-purple-600" />
        }
        if (serviceType === 'speech-to-text' || serviceType === 'audio') {
            return <Mic className="h-4 w-4 text-purple-600" />
        }
        // Default to text/LLM
        return <MessageSquare className="h-4 w-4 text-purple-600" />
    }

    // Get pricing unit based on service type
    const getPricingUnit = () => {
        const serviceType = provider.serviceType
        if (serviceType === 'text-to-image' || serviceType === 'image-editing') {
            return '0G/Image'
        }
        if (serviceType === 'speech-to-text' || serviceType === 'audio') {
            return '0G/1M Tok'
        }
        // Default to text tokens
        return '0G/1M Tok'
    }

    return (
        <Card
            className={cn(
                'relative transition-all',
                isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-lg cursor-pointer hover:scale-[1.02]'
            )}
            onClick={handleCardClick}
        >
            <CardContent className="p-5">
                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute top-2 right-2">
                        <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                    </div>
                )}

                {/* Header with name and badges */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {/* Model type icon */}
                            <div className="flex-shrink-0">
                                {getModelTypeIcon()}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                {provider.name}
                            </h3>
                            {isOfficial && (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-0 px-1.5 py-0.5 text-xs">
                                    0G
                                </Badge>
                            )}
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 px-1.5 py-0.5 text-xs">
                                {provider.verifiability}
                            </Badge>
                            {!isVerified && (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0 px-1.5 py-0.5 text-xs">
                                    Unverified
                                </Badge>
                            )}
                        </div>

                        {/* Pricing and address */}
                        <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
                            {/* Pricing section */}
                            {(provider.inputPrice !== undefined ||
                                provider.outputPrice !== undefined) && (
                                <div className="flex items-center gap-2 text-xs">
                                    {provider.inputPrice !== undefined &&
                                        provider.serviceType !== 'text-to-image' &&
                                        provider.serviceType !== 'image-editing' && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-600">In:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {provider.inputPrice.toFixed(4)}
                                                </span>
                                            </div>
                                        )}
                                    {provider.outputPrice !== undefined && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">
                                                {provider.serviceType === 'text-to-image' ||
                                                provider.serviceType === 'image-editing'
                                                    ? 'Price/Image:'
                                                    : 'Out:'}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {provider.outputPrice.toFixed(4)}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-gray-500 font-medium">{getPricingUnit()}</span>
                                </div>
                            )}

                            {/* Address with copy */}
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <code className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded cursor-default">
                                            {truncatedAddress}
                                        </code>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">{provider.address}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                            onClick={copyAddress}
                                        >
                                            {isCopied ? (
                                                <Check className="h-2.5 w-2.5 text-green-600" />
                                            ) : (
                                                <Copy className="h-2.5 w-2.5" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">{isCopied ? 'Copied!' : 'Copy address'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unverified notice */}
                {!isVerified && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                            <AlertCircle className="h-3 w-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700">
                                This provider is awaiting verification by the 0G team.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
