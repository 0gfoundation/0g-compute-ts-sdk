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
}

export function CodeBlock({ code, language = 'bash', className }: CodeBlockProps) {
    const [copied, setCopied] = React.useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``

    return (
        <div className={cn('relative', className)}>
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
                <ReactMarkdown
                    components={{
                        code: ({ children, className }) => {
                            const isInline = !className
                            if (isInline) {
                                return (
                                    <code className="bg-purple-50 text-purple-600 px-1 py-0.5 rounded text-xs font-mono">
                                        {children}
                                    </code>
                                )
                            }
                            return (
                                <code className="text-gray-800 text-sm font-mono block whitespace-pre">
                                    {children}
                                </code>
                            )
                        },
                        pre: ({ children }) => (
                            <pre className="p-4 overflow-x-auto text-sm">
                                {children}
                            </pre>
                        ),
                    }}
                >
                    {formattedCode}
                </ReactMarkdown>
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
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <code className="text-gray-800 text-sm font-mono">{code}</code>
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
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
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
