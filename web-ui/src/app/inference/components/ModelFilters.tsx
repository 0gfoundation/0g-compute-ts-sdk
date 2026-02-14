'use client'

import * as React from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export type ModelServiceTypeFilter = 'all' | 'chatbot' | 'text-to-image' | 'speech-to-text' | 'image-editing'

interface ModelFiltersProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    serviceTypeFilter: ModelServiceTypeFilter
    onServiceTypeFilterChange: (filter: ModelServiceTypeFilter) => void
    resultCount: number
    totalCount: number
}

const SERVICE_TYPE_OPTIONS: { value: ModelServiceTypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'text-to-image', label: 'Text to Image' },
    { value: 'image-editing', label: 'Image Editing' },
    { value: 'speech-to-text', label: 'Speech to Text' },
]

export function ModelFilters({
    searchQuery,
    onSearchChange,
    serviceTypeFilter,
    onServiceTypeFilterChange,
    resultCount,
    totalCount,
}: ModelFiltersProps) {
    const hasActiveFilters = serviceTypeFilter !== 'all' || searchQuery.length > 0

    const clearAllFilters = () => {
        onSearchChange('')
        onServiceTypeFilterChange('all')
    }

    const getServiceTypeLabel = () => {
        return SERVICE_TYPE_OPTIONS.find(o => o.value === serviceTypeFilter)?.label || 'All Types'
    }

    return (
        <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Service type filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`min-w-[140px] justify-between ${
                                serviceTypeFilter !== 'all' ? 'border-purple-500 text-purple-700' : ''
                            }`}
                        >
                            <span className="truncate">{getServiceTypeLabel()}</span>
                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Service Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {SERVICE_TYPE_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onServiceTypeFilterChange(option.value)}
                                className={serviceTypeFilter === option.value ? 'bg-purple-50 text-purple-700' : ''}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Results count and clear */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    Showing {resultCount} of {totalCount} models
                </span>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    )
}
