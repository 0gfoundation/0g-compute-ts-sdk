'use client'

import * as React from 'react'
import { InlineCodeBlock } from '../CodeBlock'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SetupStepProps {
    step: number
    title: string
    code?: string
    description?: string
    alert?: {
        type: 'info' | 'warning'
        message: string
    }
    packageManagerOptions?: Array<{ key: string; label: string; command: string }>
}

export function SetupStep({
    step,
    title,
    code,
    description,
    alert,
    packageManagerOptions
}: SetupStepProps) {
    const [selectedPkgManager, setSelectedPkgManager] = React.useState(
        packageManagerOptions?.[0]?.key || 'npm'
    )

    const currentCommand = packageManagerOptions
        ? packageManagerOptions.find(pm => pm.key === selectedPkgManager)?.command || code
        : code

    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
                {step}. {title}
            </h3>

            {/* Alert Box */}
            {alert && (
                <div
                    className={
                        alert.type === 'warning'
                            ? 'px-3 py-2 rounded-md bg-amber-50 border border-amber-200'
                            : 'px-3 py-2 rounded-md bg-blue-50 border border-blue-200'
                    }
                >
                    <p
                        className={
                            alert.type === 'warning'
                                ? 'text-xs text-amber-800'
                                : 'text-xs text-blue-800'
                        }
                    >
                        {alert.message}
                    </p>
                </div>
            )}

            {/* Package Manager Tabs */}
            {packageManagerOptions && packageManagerOptions.length > 0 && (
                <div>
                    {/* Custom Tab Buttons */}
                    <div className="flex gap-1 mb-0">
                        {packageManagerOptions.map((pm) => (
                            <button
                                key={pm.key}
                                onClick={() => setSelectedPkgManager(pm.key)}
                                className={`
                                    px-3 py-1.5 text-xs font-medium transition-colors
                                    rounded-t-md border border-gray-200
                                    ${selectedPkgManager === pm.key
                                        ? 'bg-gray-50 text-gray-900 border-b-gray-50'
                                        : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-gray-200'
                                    }
                                `}
                            >
                                {pm.label}
                            </button>
                        ))}
                    </div>
                    {/* Code Block - Connected to tabs */}
                    <div className="relative">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg rounded-tl-none p-4 pr-12 overflow-x-auto">
                            <code className="text-gray-800 text-sm font-mono break-all">{currentCommand}</code>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 hover:bg-gray-200"
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentCommand || '')
                                    }}
                                >
                                    <Copy className="h-4 w-4 text-gray-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy to clipboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Regular Code Block (no package manager options) */}
            {!packageManagerOptions && code && (
                <InlineCodeBlock code={code} />
            )}

            {/* Description (kept for backward compatibility but less prominent) */}
            {description && (
                <p className="text-xs text-gray-500 italic">{description}</p>
            )}
        </div>
    )
}
