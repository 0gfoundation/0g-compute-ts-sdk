"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Provider } from '../../../../shared/types/broker';
import { OFFICIAL_PROVIDERS } from '../../constants/providers';
import { copyToClipboard } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, ShieldCheck, Shield, X, Check, Clock } from 'lucide-react';

// Helper to get recently used providers from localStorage
const getRecentlyUsedProviders = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('recentlyUsedProviders');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Hook to detect mobile screen
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// Helper function to format numbers with appropriate precision
const formatNumber = (num: number): string => {
  // Use toPrecision to maintain significant digits, then parseFloat to clean up
  const cleanValue = parseFloat(num.toPrecision(15));

  // If the number is very small, show more decimal places
  if (Math.abs(cleanValue) < 0.000001) {
    return cleanValue.toFixed(12).replace(/\.?0+$/, '');
  }
  // For larger numbers, show fewer decimal places
  else if (Math.abs(cleanValue) < 0.01) {
    return cleanValue.toFixed(8).replace(/\.?0+$/, '');
  }
  // For normal sized numbers, show up to 6 decimal places
  else {
    return cleanValue.toFixed(6).replace(/\.?0+$/, '');
  }
};

interface ProviderSelectorProps {
  // Provider selection
  providers: Provider[];
  selectedProvider: Provider | null;
  onProviderSelect: (provider: Provider) => void;

  // UI state
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isInitializing: boolean;

  // Provider info
  providerBalance: number | null;
  providerBalanceNeuron: bigint | null;
  providerPendingRefund: number | null;

  // Actions
  onAddFunds: () => void;
}

// Mobile Provider Card Component
function MobileProviderCard({
  provider,
  isSelected,
  isRecentlyUsed,
  onSelect,
}: {
  provider: Provider;
  isSelected: boolean;
  isRecentlyUsed: boolean;
  onSelect: () => void;
}) {
  const isTeeVerified = provider.verifiability?.toLowerCase().includes('teeml') || provider.verifiability?.toLowerCase().includes('tee');
  const isOfficial = OFFICIAL_PROVIDERS.some((op) => op.address === provider.address);

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{provider.name}</span>
            {isSelected && (
              <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* TEE Badge */}
            {isTeeVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <ShieldCheck className="w-3 h-3" />
                TEE Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Shield className="w-3 h-3" />
                Standard
              </span>
            )}
            {/* Official Badge */}
            {isOfficial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                0G Official
              </span>
            )}
            {/* Recently Used Badge */}
            {isRecentlyUsed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Clock className="w-3 h-3" />
                Recently Used
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      {(provider.inputPrice !== undefined || provider.outputPrice !== undefined) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Input</span>
              <div className="font-medium text-gray-900">
                {provider.inputPrice?.toFixed(2) ?? '—'} <span className="text-gray-500 text-xs">0G/1M</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Output</span>
              <div className="font-medium text-gray-900">
                {provider.outputPrice?.toFixed(2) ?? '—'} <span className="text-gray-500 text-xs">0G/1M</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address */}
      <div className="mt-2 text-xs text-gray-400 font-mono">
        {provider.address.slice(0, 10)}...{provider.address.slice(-8)}
      </div>
    </button>
  );
}

export function ProviderSelector({
  providers,
  selectedProvider,
  onProviderSelect,
  isDropdownOpen,
  setIsDropdownOpen,
  isInitializing,
  providerBalance,
  providerBalanceNeuron,
  providerPendingRefund,
  onAddFunds,
}: ProviderSelectorProps) {
  const isMobile = useIsMobile();
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  // Recently used providers set for quick lookup
  const recentlyUsedSet = useMemo(() => {
    const used = getRecentlyUsedProviders();
    return new Set(used);
  }, []);

  // Filter out unverified providers - only show verified providers that can be used
  const verifiedProviders = useMemo(() => {
    return providers.filter((p) => p.teeSignerAcknowledged === true);
  }, [providers]);

  // Filter providers based on search query for mobile (from verified providers only)
  const filteredProviders = useMemo(() => {
    if (!mobileSearchQuery.trim()) return verifiedProviders;
    const query = mobileSearchQuery.toLowerCase();
    return verifiedProviders.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.verifiability?.toLowerCase().includes(query)
    );
  }, [verifiedProviders, mobileSearchQuery]);

  // Handle mobile provider selection
  const handleMobileSelect = (provider: Provider) => {
    onProviderSelect(provider);
    setIsDropdownOpen(false);
    setMobileSearchQuery('');
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 xl:space-x-4 min-w-0 flex-1">
      {/* Provider Selection Button */}
      <div className="relative min-w-0 flex-shrink sm:min-w-[140px] lg:min-w-[200px] xl:min-w-[400px] provider-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-white border border-gray-300 rounded-md pl-2 sm:pl-3 pr-8 sm:pr-10 py-2 sm:py-3 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-xs sm:text-sm"
          disabled={isInitializing || providers.length === 0}
        >
          {isInitializing ? (
            <span className="text-gray-500">Loading...</span>
          ) : providers.length === 0 ? (
            <span className="text-gray-500">No providers</span>
          ) : selectedProvider ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-medium text-xs sm:text-sm truncate">
                  {selectedProvider.name}
                </span>
                {/* Address - only on xl screens */}
                <span className="hidden xl:inline text-gray-500">•</span>
                <span className="hidden xl:inline text-gray-600 text-xs">
                  {selectedProvider.address.slice(0, 8)}...
                  {selectedProvider.address.slice(-6)}
                </span>
                {/* Verifiability badge - hidden on small screens */}
                <span className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  selectedProvider.verifiability?.toLowerCase().includes('teeml') || selectedProvider.verifiability?.toLowerCase().includes('tee')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedProvider.verifiability}
                </span>
                {OFFICIAL_PROVIDERS.some(
                  (op) => op.address === selectedProvider.address
                ) && (
                  <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    0G
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Select</span>
          )}
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Desktop Dropdown Menu */}
        {!isMobile && isDropdownOpen && verifiedProviders.length > 0 && (
          <div className="absolute z-10 w-full min-w-[200px] sm:min-w-[280px] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {verifiedProviders.map((provider) => (
              <div
                key={provider.address}
                onClick={() => {
                  onProviderSelect(provider);
                  setIsDropdownOpen(false);
                }}
                className="px-2 sm:px-3 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                    <span className="font-medium text-xs sm:text-sm">{provider.name}</span>
                    {/* Address - hidden on mobile */}
                    <span className="hidden md:inline text-gray-500">•</span>
                    <span className="hidden md:inline text-gray-600 text-xs">
                      {provider.address.slice(0, 8)}...
                      {provider.address.slice(-6)}
                    </span>
                    {/* Verifiability badge */}
                    <span className={`inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium ${
                      provider.verifiability?.toLowerCase().includes('teeml') || provider.verifiability?.toLowerCase().includes('tee')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {provider.verifiability}
                    </span>
                    {OFFICIAL_PROVIDERS.some(
                      (op) => op.address === provider.address
                    ) && (
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        0G
                      </span>
                    )}
                  </div>
                </div>
                {provider.inputPrice !== undefined ||
                provider.outputPrice !== undefined ? (
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="text-gray-400">Input:</span> {provider.inputPrice?.toFixed(2) ?? '—'}
                    <span className="mx-1">|</span>
                    <span className="text-gray-400">Output:</span> {provider.outputPrice?.toFixed(2) ?? '—'}
                    <span className="ml-1 text-gray-400">0G/1M tokens</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Mobile Full-Screen Sheet */}
        {isMobile && (
          <Sheet open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
              <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-semibold">Select Provider</SheetTitle>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {mobileSearchQuery && (
                    <button
                      onClick={() => setMobileSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </SheetHeader>

              {/* Provider List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredProviders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No providers found</p>
                    {mobileSearchQuery && (
                      <p className="text-sm mt-1">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  filteredProviders.map((provider) => (
                    <MobileProviderCard
                      key={provider.address}
                      provider={provider}
                      isSelected={selectedProvider?.address === provider.address}
                      isRecentlyUsed={recentlyUsedSet.has(provider.address)}
                      onSelect={() => handleMobileSelect(provider)}
                    />
                  ))
                )}
              </div>

              {/* Footer with count */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Provider Info Bar - Redesigned */}
      {selectedProvider && (
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Left Section: Provider Status and Address - only on xl screens */}
          <div className="hidden xl:flex items-center gap-2 flex-1">
            {/* Verification Status */}
            {selectedProvider.verifiability?.toLowerCase().includes('teeml') || selectedProvider.verifiability?.toLowerCase().includes('tee') ? (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-green-700">TEE Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-purple-700">Standard</span>
              </div>
            )}

            {/* Provider Address with Copy */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 font-mono">
                {selectedProvider.address.slice(0, 6)}...{selectedProvider.address.slice(-4)}
              </span>
              <div className="relative group">
                <button
                  onClick={() => copyToClipboard(selectedProvider.address)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                >
                <svg
                  className="w-3 h-3 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                </button>
                {/* Copy Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  Copy address
                </div>
              </div>
            </div>
          </div>
          {/* Center Section: Price Info - only on lg screens and up */}
          {(selectedProvider.inputPrice !== undefined ||
            selectedProvider.outputPrice !== undefined) && (
            <div className="hidden lg:block relative group">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-200">
                <svg
                  className="w-3.5 h-3.5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  {selectedProvider.inputPrice !== undefined && (
                    <span>{selectedProvider.inputPrice.toFixed(2)}</span>
                  )}
                  {selectedProvider.inputPrice !== undefined &&
                    selectedProvider.outputPrice !== undefined && (
                      <span className="mx-0.5">/</span>
                    )}
                  {selectedProvider.outputPrice !== undefined && (
                    <span>{selectedProvider.outputPrice.toFixed(2)}</span>
                  )}
                  <span className="ml-1 text-gray-500">0G/M</span>
                </span>
              </div>
              {/* Price Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
                <div className="font-semibold mb-1">Price per 1 Million Tokens</div>
                {selectedProvider.inputPrice !== undefined && (
                  <div>Input (what you send): {selectedProvider.inputPrice.toFixed(4)} 0G</div>
                )}
                {selectedProvider.outputPrice !== undefined && (
                  <div>Output (AI response): {selectedProvider.outputPrice.toFixed(4)} 0G</div>
                )}
                <div className="text-gray-400 mt-1 border-t border-gray-700 pt-1">
                  ~{((selectedProvider.inputPrice || 0) + (selectedProvider.outputPrice || 0)).toFixed(4)} 0G per typical message
                </div>
              </div>
            </div>
          )}
          {/* Right Section: Balance and Add Funds */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-1 rounded-md">
            <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-xs ${
              (providerBalanceNeuron !== null && providerBalanceNeuron === BigInt(0)) || (providerBalance ?? 0) === 0
                ? 'bg-red-50 border-red-200'
                : providerBalanceNeuron !== null &&
                  selectedProvider.inputPriceNeuron !== undefined &&
                  selectedProvider.outputPriceNeuron !== undefined &&
                  providerBalanceNeuron <= BigInt(50000) * (selectedProvider.inputPriceNeuron + selectedProvider.outputPriceNeuron)
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white border-gray-200'
            }`}>
              {/* Status icon - hidden on very small screens */}
              {(providerBalanceNeuron !== null && providerBalanceNeuron === BigInt(0)) || (providerBalance ?? 0) === 0 ? (
                <svg
                  className="hidden sm:block w-3.5 h-3.5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : providerBalanceNeuron !== null &&
                selectedProvider.inputPriceNeuron !== undefined &&
                selectedProvider.outputPriceNeuron !== undefined &&
                providerBalanceNeuron <= BigInt(50000) * (selectedProvider.inputPriceNeuron + selectedProvider.outputPriceNeuron) ? (
                <svg
                  className="hidden sm:block w-3.5 h-3.5 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="hidden sm:block w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              )}
              <span className={`font-medium whitespace-nowrap ${
                (providerBalanceNeuron !== null && providerBalanceNeuron === BigInt(0)) || (providerBalance ?? 0) === 0
                  ? 'text-red-700'
                  : providerBalanceNeuron !== null &&
                    selectedProvider.inputPriceNeuron !== undefined &&
                    selectedProvider.outputPriceNeuron !== undefined &&
                    providerBalanceNeuron <= BigInt(50000) * (selectedProvider.inputPriceNeuron + selectedProvider.outputPriceNeuron)
                  ? 'text-yellow-700'
                  : 'text-gray-700'
              }`}>
                {providerBalance !== null ? (
                  <>
                    <span className="sm:hidden">{providerBalance.toFixed(2)}</span>
                    <span className="hidden sm:inline">{formatNumber(providerBalance)}</span>
                    <span className="ml-0.5">0G</span>
                    {providerPendingRefund !== null && providerPendingRefund > 0 && (
                      <span className="hidden md:inline text-orange-600"> (+{formatNumber(providerPendingRefund)} pending)</span>
                    )}
                  </>
                ) : (
                  '...'
                )}
              </span>
            </div>
            <button
              onClick={onAddFunds}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                (providerBalanceNeuron !== null && providerBalanceNeuron === BigInt(0)) || (providerBalance ?? 0) === 0
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-md animate-pulse'
                  : providerBalanceNeuron !== null &&
                    selectedProvider.inputPriceNeuron !== undefined &&
                    selectedProvider.outputPriceNeuron !== undefined &&
                    providerBalanceNeuron <= BigInt(50000) * (selectedProvider.inputPriceNeuron + selectedProvider.outputPriceNeuron)
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
              title="Add Funds"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Funds</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}