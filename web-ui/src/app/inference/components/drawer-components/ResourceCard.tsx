'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface ResourceCardProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    href: string
    buttonText: string
}

export function ResourceCard({
    icon: Icon,
    title,
    description,
    href,
    buttonText,
}: ResourceCardProps) {
    return (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-purple-600 mt-0.5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {buttonText}
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
