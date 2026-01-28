'use client'

import * as React from 'react'
import { Search, Filter, ChevronDown, X } from 'lucide-react'
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

export type VerificationFilter = 'all' | 'verified' | 'unverified'
export type ServiceTypeFilter = 'all' | 'chatbot' | 'text-to-image' | 'speech-to-text'
export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'recently-used'

interface ProviderFiltersProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    verificationFilter: VerificationFilter
    onVerificationFilterChange: (filter: VerificationFilter) => void
    serviceTypeFilter: ServiceTypeFilter
    onServiceTypeFilterChange: (filter: ServiceTypeFilter) => void
    sortOption: SortOption
    onSortChange: (sort: SortOption) => void
    resultCount: number
    totalCount: number
}

const VERIFICATION_OPTIONS: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All Providers' },
    { value: 'verified', label: 'TEE Verified' },
    { value: 'unverified', label: 'Unverified' },
]

const SERVICE_TYPE_OPTIONS: { value: ServiceTypeFilter; label: string }[] = [
    { value: 'all', label: 'All Services' },
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'text-to-image', label: 'Text to Image' },
    { value: 'speech-to-text', label: 'Speech to Text' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'recently-used', label: 'Recently Used' },
]

export function ProviderFilters({
    searchQuery,
    onSearchChange,
    verificationFilter,
    onVerificationFilterChange,
    serviceTypeFilter,
    onServiceTypeFilterChange,
    sortOption,
    onSortChange,
    resultCount,
    totalCount,
}: ProviderFiltersProps) {
    const hasActiveFilters = verificationFilter !== 'all' || serviceTypeFilter !== 'all' || searchQuery.length > 0

    const clearAllFilters = () => {
        onSearchChange('')
        onVerificationFilterChange('all')
        onServiceTypeFilterChange('all')
        onSortChange('name-asc')
    }

    const getVerificationLabel = () => {
        return VERIFICATION_OPTIONS.find(o => o.value === verificationFilter)?.label || 'Verification'
    }

    const getServiceTypeLabel = () => {
        return SERVICE_TYPE_OPTIONS.find(o => o.value === serviceTypeFilter)?.label || 'Service Type'
    }

    const getSortLabel = () => {
        return SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort'
    }

    return (
        <div className="mb-4 space-y-3">
            {/* Search and filters row */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by name or address..."
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

                {/* Filter dropdowns */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {/* Verification filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`min-w-[130px] justify-between ${
                                    verificationFilter !== 'all' ? 'border-purple-500 text-purple-700' : ''
                                }`}
                            >
                                <span className="truncate">{getVerificationLabel()}</span>
                                <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Verification Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {VERIFICATION_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => onVerificationFilterChange(option.value)}
                                    className={verificationFilter === option.value ? 'bg-purple-50 text-purple-700' : ''}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Service type filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`min-w-[130px] justify-between ${
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

                    {/* Sort dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="min-w-[150px] justify-between">
                                <span className="truncate">{getSortLabel()}</span>
                                <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SORT_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => onSortChange(option.value)}
                                    className={sortOption === option.value ? 'bg-purple-50 text-purple-700' : ''}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Results count and clear filters */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    Showing {resultCount} of {totalCount} providers
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
