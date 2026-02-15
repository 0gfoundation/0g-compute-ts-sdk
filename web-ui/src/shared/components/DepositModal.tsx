"use client";

import React, { useState, useEffect } from "react";
import { useChainId, useBalance, useAccount } from "wagmi";
import { formatUnits } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBroker } from "../providers/BrokerProvider";
import { zgTestnet } from "../config/wagmi";
import { MINIMUM_DEPOSITS } from "../constants/limits";
import { DEPOSIT_PRESETS } from "../constants/deposits";
import { formatBlockchainError } from "../utils/blockchainErrors";

interface DepositModalProps {
  open: boolean;
  onDeposit: () => void;
  onCancel: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function DepositModal({ open, onDeposit, onCancel, onLoadingChange }: DepositModalProps) {
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const { data: balanceData } = useBalance({
    address: userAddress,
  });
  const { addLedger, depositFund, refreshLedgerInfo } = useBroker();

  const isTestnet = chainId === zgTestnet.id;
  const minimumDeposit = isTestnet
    ? MINIMUM_DEPOSITS.INITIAL_TESTNET
    : MINIMUM_DEPOSITS.INITIAL_MAINNET;
  const presets = isTestnet ? DEPOSIT_PRESETS.testnet : DEPOSIT_PRESETS.mainnet;

  const walletBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, 18))
    : 0;

  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    minimumDeposit
  );
  const [customAmount, setCustomAmount] = useState(String(minimumDeposit));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens or chain changes
  useEffect(() => {
    if (open) {
      setSelectedPreset(minimumDeposit);
      setCustomAmount(String(minimumDeposit));
      setError(null);
      setIsLoading(false);
    }
  }, [open, minimumDeposit]);

  const depositAmount = selectedPreset ?? parseFloat(customAmount);
  const isValid =
    !isNaN(depositAmount) &&
    depositAmount >= minimumDeposit &&
    depositAmount <= walletBalance;
  const isOverBalance = !isNaN(depositAmount) && depositAmount > walletBalance;

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setCustomAmount(String(value));
    setError(null);
  };

  const handleCustomInput = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
    setError(null);
  };

  const handleDeposit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      // Fresh check to determine if account exists
      const info = await refreshLedgerInfo();
      if (info) {
        await depositFund(depositAmount);
      } else {
        await addLedger(depositAmount);
      }
      await refreshLedgerInfo();
      onDeposit();
    } catch (err: unknown) {
      setError(formatBlockchainError(err));
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            A deposit is required to use AI inference services.
          </DialogDescription>
        </DialogHeader>

        {/* Preset amounts */}
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selectedPreset === preset.value
                  ? "bg-purple-100 border-purple-500 text-purple-700"
                  : "bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Custom Amount
          </label>
          <div className="relative">
            <Input
              type="number"
              min={minimumDeposit}
              step="0.1"
              value={customAmount}
              onChange={(e) => handleCustomInput(e.target.value)}
              disabled={isLoading}
              className="pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder={`Min ${minimumDeposit}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              0G
            </span>
          </div>
          <div className="mt-1 flex justify-between items-center text-xs">
            <span className="text-gray-500">Minimum: {minimumDeposit} 0G</span>
            <span className="text-gray-600">
              Wallet: {walletBalance.toFixed(4)} 0G
            </span>
          </div>
          {isOverBalance && (
            <p className="mt-1 text-xs text-red-600">
              Insufficient wallet balance
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleDeposit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Depositing...
              </>
            ) : (
              `Deposit ${isValid ? depositAmount : ""} 0G`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
