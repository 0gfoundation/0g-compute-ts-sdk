'use client'

import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'

interface ResourceCardProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    href: string
    buttonText?: string // Made optional since we're using the whole card as link
}

export function ResourceCard({
    icon: Icon,
    title,
    description,
    href,
}: ResourceCardProps) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white rounded-lg p-6 border border-gray-200
                       shadow-sm hover:shadow-md hover:border-purple-200
                       transition-all duration-200 cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    {/* Icon with background container */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center
                                      group-hover:bg-purple-700 transition-colors">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Arrow icon - right side */}
                <div className="flex-shrink-0 ml-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
                                  group-hover:bg-purple-100 transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Optional: Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent
                          group-hover:bg-purple-500 rounded-l-lg transition-colors"
                 style={{ position: 'absolute', left: 0 }}>
            </div>
        </a>
    )
}
