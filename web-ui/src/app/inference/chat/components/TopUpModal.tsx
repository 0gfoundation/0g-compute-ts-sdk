"use client";

import * as React from "react";
import { useState } from "react";
import { a0giToNeuron } from "../../../../shared/utils/currency";
import { formatNumber } from "../../../../shared/utils/formatNumber";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MINIMUM_DEPOSITS } from "@/shared/constants/limits";

// Preset amounts for quick top-up
const TOPUP_PRESETS = [
  { value: 1, label: '1 0G' },
  { value: 5, label: '5 0G' },
  { value: 10, label: '10 0G' },
  { value: 25, label: '25 0G' },
];

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
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetClick = (presetValue: number) => {
    setSelectedPreset(presetValue);
    setTopUpAmount(presetValue.toString());
  };

  const handleCustomInput = (value: string) => {
    setTopUpAmount(value);
    setSelectedPreset(null);
  };

  const handleTopUp = async () => {
    if (!broker || !selectedProvider || !topUpAmount) {
      return;
    }

    const amountInA0gi = parseFloat(topUpAmount);
    if (isNaN(amountInA0gi) || amountInA0gi <= 0) return;

    // Validate minimum amount for provider transfer
    if (amountInA0gi < MINIMUM_DEPOSITS.TOPUP_PROVIDER) {
      toast({
        variant: "destructive",
        title: "Minimum Amount Required",
        description: `Minimum transfer to provider is ${MINIMUM_DEPOSITS.TOPUP_PROVIDER} 0G`,
      });
      return;
    }

    setIsTopping(true);
    setErrorWithTimeout(null);

    try {
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

      // Show success toast
      toast({
        title: "Funds Transferred",
        description: `Successfully transferred ${topUpAmount} 0G to ${selectedProvider.name || 'provider'}.`,
      });

      // Close modal and reset amount
      onClose();
      setTopUpAmount("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to top up. Please try again.";
      setErrorWithTimeout(`Top up error: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: errorMessage,
      });
    } finally {
      setIsTopping(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isTopping) {
      onClose();
      setTopUpAmount("");
      setSelectedPreset(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds for the Current Provider Service</DialogTitle>
          <DialogDescription>
            Transfer funds from your available balance to pay for this provider&apos;s services.
            Current funds: <span className="font-semibold">{formatNumber(providerBalance ?? 0)} 0G</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pending refund notice */}
          {providerPendingRefund && providerPendingRefund > 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <p className="mb-1">
                  <span className="font-semibold">Pending Refund: {formatNumber(providerPendingRefund)} 0G</span>
                </p>
                <p className="text-xs">
                  You have a pending withdrawal from this provider. Once the lock period expires, go to the{' '}
                  <a href="/wallet" className="underline font-medium">wallet page</a> to retrieve these funds.
                </p>
              </div>
            </div>
          ) : null}

          <div className="text-xs text-gray-500">
            Available for Transfer: {ledgerInfo ? (
              <span className="font-medium">{formatNumber(ledgerInfo.availableBalance)} 0G</span>
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

          {/* Quick top-up preset amounts */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Quick Top-up
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TOPUP_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  disabled={isTopping}
                  className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                    selectedPreset === preset.value
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  } ${isTopping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-semibold">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Custom Amount
            </label>
            <div className="relative">
              <Input
                type="number"
                id="top-up-amount"
                value={topUpAmount}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder="Enter amount"
                min={MINIMUM_DEPOSITS.TOPUP_PROVIDER}
                step="0.000001"
                className="pr-12"
                disabled={isTopping}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">0G</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Minimum transfer amount: {MINIMUM_DEPOSITS.TOPUP_PROVIDER} 0G</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The minimum transfer ensures efficient transaction processing on the network. Smaller amounts would have disproportionate gas costs.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Provider trust notice - simplified for web users */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-blue-800">
                <p>
                  By transferring funds, you acknowledge this provider as trusted. Your funds will be used to pay for AI services from this provider.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleTopUp}
            disabled={
              isTopping ||
              !topUpAmount ||
              parseFloat(topUpAmount) < MINIMUM_DEPOSITS.TOPUP_PROVIDER ||
              !ledgerInfo ||
              parseFloat(topUpAmount) > parseFloat(ledgerInfo.availableBalance)
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
