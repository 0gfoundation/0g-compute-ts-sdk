"use client";

import * as React from "react";
import { useBrokerOperations } from "../../../../shared/hooks/useBrokerOperations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
  // Use unified broker operations hook
  const { transferFund } = useBrokerOperations();

  const handleTopUp = async () => {
    if (!broker || !selectedProvider || !topUpAmount || parseFloat(topUpAmount) <= 0) {
      return;
    }

    setIsTopping(true);
    setErrorWithTimeout(null);

    try {
      const amountInA0gi = parseFloat(topUpAmount);

      // Use unified transferFund method
      // This handles:
      // - Currency conversion (a0giToNeuron)
      // - Broker transfer call
      // - Parallel refresh of ledger and provider balance
      // - Consistent error handling
      await transferFund(
        selectedProvider.address,
        amountInA0gi,
        'inference',
        refreshProviderBalance
      );

      // Close modal and reset amount
      onClose();
      setTopUpAmount("");
    } catch (err: unknown) {
      // Error is already formatted by useBrokerOperations
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to top up. Please try again.";
      setErrorWithTimeout(`Top up error: ${errorMessage}`);
    } finally {
      setIsTopping(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isTopping) {
      onClose();
      setTopUpAmount("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds for the Current Provider Service</DialogTitle>
          <DialogDescription>
            Transfer funds from your available balance to pay for this provider&apos;s services.
            Current funds: <span className="font-semibold">{(providerBalance ?? 0).toFixed(6)} 0G</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Check if there's pending refund */}
          {providerPendingRefund && providerPendingRefund > 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <p className="mb-2">
                  <span className="font-semibold">Pending Refund: {formatNumber(providerPendingRefund)} 0G</span>
                </p>
                <p className="text-xs mb-3">
                  You previously requested to withdraw funds from this provider. Please cancel the withdrawal request to replenish the fund.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Use parseFloat to clean up floating point precision issues
                    // and toPrecision to maintain significant digits
                    const cleanValue = parseFloat(providerPendingRefund.toPrecision(15));
                    setTopUpAmount(cleanValue.toString());
                  }}
                  className="bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600"
                  disabled={isTopping}
                >
                  Use Pending Refund ({formatNumber(providerPendingRefund)} 0G)
                </Button>
              </div>
            </div>
          ) : null}

          <div className="text-xs text-gray-500">
            Available for Transfer: {ledgerInfo ? (
              <span className="font-medium">{(parseFloat(ledgerInfo.availableBalance) + (providerPendingRefund || 0)).toFixed(6)} 0G</span>
            ) : (
              <span>Loading...</span>
            )}
            {' '}(<a
              href="/wallet"
              className="text-purple-500 hover:text-purple-700 hover:underline"
              title="Go to ledger page to view details and deposit funds"
            >
              view details and deposit in account page
            </a>)
          </div>

          <div className="relative">
            <Input
              type="number"
              id="top-up-amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder={providerPendingRefund && providerPendingRefund > 0 ? "" : "Min 1 0G"}
              min="1"
              step="0.000001"
              className="pr-12"
              disabled={isTopping}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">0G</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Minimum transfer amount: 1 0G</p>

          <Button
            onClick={handleTopUp}
            disabled={
              isTopping ||
              !topUpAmount ||
              parseFloat(topUpAmount) < 1 ||
              !ledgerInfo ||
              parseFloat(topUpAmount) > parseFloat(ledgerInfo.totalBalance)
            }
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isTopping ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              "Transfer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
