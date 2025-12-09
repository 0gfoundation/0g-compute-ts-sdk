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
    MessageCircle,
    Code,
    Copy,
    AlertCircle,
    Loader2,
} from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'
import type { Provider } from '@/shared/types/broker'

interface ProviderCardProps {
    provider: Provider
    isOfficial: boolean
    isLoading?: boolean
    onChat?: (provider: Provider) => void
    onBuild?: (provider: Provider) => void
}

export function ProviderCard({
    provider,
    isOfficial,
    isLoading = false,
    onChat,
    onBuild,
}: ProviderCardProps) {
    const isVerified = provider.teeSignerAcknowledged ?? false
    const isDisabled = !isVerified

    const copyAddress = async () => {
        await copyToClipboard(provider.address)
    }

    const truncatedAddress = `${provider.address.slice(0, 8)}...${provider.address.slice(-6)}`

    return (
        <Card
            className={cn(
                'relative transition-shadow',
                isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-lg cursor-pointer'
            )}
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
                                        provider.serviceType !== 'text-to-image' && (
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
                                                {provider.serviceType === 'text-to-image'
                                                    ? 'Price/Image:'
                                                    : 'Out:'}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {provider.outputPrice.toFixed(4)}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-gray-500">0G</span>
                                </div>
                            )}

                            {/* Address with copy */}
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <code className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded cursor-default">
                                            {truncatedAddress}
                                        </code>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{provider.address}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                            onClick={copyAddress}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy address</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 mt-1">
                    {isDisabled ? (
                        <>
                            {provider.serviceType === 'chatbot' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs cursor-not-allowed"
                                    disabled
                                >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Chat
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs cursor-not-allowed"
                                disabled
                            >
                                <Code className="h-3 w-3 mr-1" />
                                Build
                            </Button>
                        </>
                    ) : (
                        <>
                            {provider.serviceType === 'chatbot' && onChat && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs text-gray-600 border-gray-300 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200"
                                    onClick={() => onChat(provider)}
                                >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Chat
                                </Button>
                            )}
                            {onBuild && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs text-gray-600 border-gray-300 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200"
                                    onClick={() => onBuild(provider)}
                                >
                                    <Code className="h-3 w-3 mr-1" />
                                    Build
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Unverified notice */}
                {!isVerified && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                            <AlertCircle className="h-3 w-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700">
                                This provider has not been verified and cannot be used
                                until verification is complete.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
