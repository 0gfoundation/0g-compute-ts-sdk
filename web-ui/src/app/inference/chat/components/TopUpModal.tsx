"use client";

import * as React from "react";
import { a0giToNeuron } from "../../../../shared/utils/currency";

interface Provider {
  address: string;
  name: string;
}

interface LedgerInfo {
  availableBalance: string;
  totalBalance: string;
}

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: any; // TODO: Replace with proper broker type when available
  selectedProvider: Provider | null;
  topUpAmount: string;
  setTopUpAmount: (amount: string) => void;
  isTopping: boolean;
  setIsTopping: (loading: boolean) => void;
  providerBalance: number | null;
  providerPendingRefund: number | null;
  ledgerInfo: LedgerInfo | null;
  refreshLedgerInfo: () => Promise<void>;
  refreshProviderBalance: () => Promise<void>;
  setErrorWithTimeout: (error: string | null) => void;
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

export function TopUpModal({
  isOpen,
  onClose,
  broker,
  selectedProvider,
  topUpAmount,
  setTopUpAmount,
  isTopping,
  setIsTopping,
  providerBalance,
  providerPendingRefund,
  ledgerInfo,
  refreshLedgerInfo,
  refreshProviderBalance,
  setErrorWithTimeout,
}: TopUpModalProps) {
  const handleTopUp = async () => {
    if (!broker || !selectedProvider || !topUpAmount || parseFloat(topUpAmount) <= 0) {
      return;
    }

    setIsTopping(true);
    setErrorWithTimeout(null);

    try {
      const amountInA0gi = parseFloat(topUpAmount);
      const amountInNeuron = a0giToNeuron(amountInA0gi);
      
      // Call the transfer function with neuron amount
      await broker.ledger.transferFund(
        selectedProvider.address,
        'inference',
        amountInNeuron
      );

      // Refresh both ledger info and provider balance in parallel for better performance
      await Promise.all([
        refreshLedgerInfo(), // Refresh ledger info to update available balance
        refreshProviderBalance() // Refresh provider balance using hook's function
      ]);
      
      // Close modal and reset amount
      onClose();
      setTopUpAmount("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to top up. Please try again.";
      setErrorWithTimeout(`Top up error: ${errorMessage}`);
    } finally {
      setIsTopping(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={() => {
          if (!isTopping) {
            onClose();
            setTopUpAmount("");
          }
        }}
      />

      {/* Modal content */}
      <div className="relative z-10 mx-auto p-8 w-96 bg-white rounded-xl shadow-2xl border border-gray-100">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Funds for the Current Provider Service
            </h3>
            <button
              onClick={() => {
                if (!isTopping) {
                  onClose();
                  setTopUpAmount("");
                }
              }}
              className="text-gray-400 hover:text-gray-600"
              disabled={isTopping}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Transfer Amount Input */}
            <div>
              <p className="mb-3 text-sm text-gray-600">
                Transfer funds from your available balance to pay for this provider's services. Current funds: <span className="font-semibold">{(providerBalance ?? 0).toFixed(6)} 0G</span>
              </p>
              
              {/* Check if there's pending refund */}
              {providerPendingRefund && providerPendingRefund > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <p className="mb-2">
                      <span className="font-semibold">Pending Refund: {formatNumber(providerPendingRefund)} 0G</span>
                    </p>
                    <p className="text-xs mb-3">
                      You previously requested to withdraw funds from this provider. Please cancel the withdrawal request to replenish the fund.
                    </p>
                    <button
                      onClick={() => {
                        // Use parseFloat to clean up floating point precision issues
                        // and toPrecision to maintain significant digits
                        const cleanValue = parseFloat(providerPendingRefund.toPrecision(15));
                        setTopUpAmount(cleanValue.toString());
                      }}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700 transition-colors cursor-pointer"
                      disabled={isTopping}
                    >
                      Use Pending Refund ({formatNumber(providerPendingRefund)} 0G)
                    </button>
                  </div>
                </div>
              ) : null}
              
              <div className="text-xs text-gray-500 mb-3">
                Available for Transfer: {ledgerInfo ? (
                  <span className="font-medium">{(parseFloat(ledgerInfo.availableBalance) + (providerPendingRefund || 0)).toFixed(6)} 0G</span>
                ) : (
                  <span>Loading...</span>
                )}
                {' '}(<a
                  href="/wallet"
                  className="text-purple-500 hover:text-purple-700 hover:underline cursor-pointer"
                  title="Go to ledger page to view details and deposit funds"
                >
                  view details and deposit in account page
                </a>)
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="top-up-amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder={providerPendingRefund && providerPendingRefund > 0 ? "" : "Min 1 0G"}
                  min="1"
                  step="0.000001"
                  className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isTopping}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">0G</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum transfer amount: 1 0G</p>
            </div>

            {/* Auto-acknowledge notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-blue-800">
                  <p className="mb-1">
                    This transfer will automatically acknowledge this provider as trusted.
                  </p>
                  <p className="text-blue-600">
                    To re-verify the provider, use CLI command:{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono break-all">
                      0g-compute-cli inference verify --provider {selectedProvider?.address || '<address>'}
                    </code>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleTopUp}
              disabled={
                isTopping ||
                !topUpAmount ||
                parseFloat(topUpAmount) < 1 ||
                !ledgerInfo ||
                parseFloat(topUpAmount) > parseFloat(ledgerInfo.totalBalance)
              }
              className="w-full px-4 py-3 bg-purple-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isTopping ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </span>
              ) : (
                "Transfer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}