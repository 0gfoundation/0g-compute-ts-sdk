'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface CodeBlockProps {
    code: string
    language?: string
    className?: string
    title?: string
    languageOptions?: Array<{ key: string; label: string }>
    onLanguageChange?: (key: string) => void
    selectedLanguage?: string
}

export function CodeBlock({
    code,
    language = 'bash',
    className,
    title,
    languageOptions,
    onLanguageChange,
    selectedLanguage
}: CodeBlockProps) {
    const [copied, setCopied] = React.useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``

    return (
        <div className={cn('relative border border-gray-200 rounded-lg overflow-hidden', className)}>
            {/* Header Bar */}
            {(title || languageOptions) && (
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{title || ''}</span>
                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        {languageOptions && languageOptions.length > 1 && (
                            <select
                                value={selectedLanguage || languageOptions[0].key}
                                onChange={(e) => onLanguageChange?.(e.target.value)}
                                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {languageOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        {/* Copy Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-gray-200"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-gray-600" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Code Content */}
            <div className="bg-gray-50 overflow-x-auto max-h-[600px]">
                <ReactMarkdown
                    components={{
                        code: ({ children, className }) => {
                            const isInline = !className
                            if (isInline) {
                                return (
                                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                                        {children}
                                    </code>
                                )
                            }
                            return (
                                <code className="text-gray-800 text-sm font-mono block whitespace-pre-wrap break-all">
                                    {children}
                                </code>
                            )
                        },
                        pre: ({ children }) => (
                            <pre className="p-4 pr-12 text-sm">
                                {children}
                            </pre>
                        ),
                    }}
                >
                    {formattedCode}
                </ReactMarkdown>
            </div>

            {/* Copy Button (when no header) */}
            {!title && !languageOptions && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 hover:bg-gray-200"
                            onClick={copyToClipboard}
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4 text-gray-600" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    )
}

interface InlineCodeBlockProps {
    code: string
    className?: string
}

export function InlineCodeBlock({ code, className }: InlineCodeBlockProps) {
    const [copied, setCopied] = React.useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={cn('relative', className)}>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 pr-12 overflow-x-auto">
                <code className="text-gray-800 text-sm font-mono break-all">{code}</code>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 hover:bg-gray-200"
                        onClick={copyToClipboard}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}
