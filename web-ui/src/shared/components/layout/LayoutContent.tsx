"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useBroker } from "../../providers/BrokerProvider";
import { NavigationProvider, useNavigation } from "../navigation/OptimizedNavigation";
import SimpleLoader from "../ui/SimpleLoader";
import { copyToClipboard } from "@/lib/utils";
import { zgTestnet, zgMainnet } from "../../config/wagmi";
import { formatBlockchainError } from "../../utils/blockchainErrors";
import { MINIMUM_DEPOSITS } from "../../constants/limits";

// Preset amounts for initial deposit (network-aware)
const MAINNET_DEPOSIT_PRESETS = [
  { value: 3, label: '3 0G' },
  { value: 10, label: '10 0G' },
  { value: 25, label: '25 0G' },
  { value: 50, label: '50 0G' },
];

const TESTNET_DEPOSIT_PRESETS = [
  { value: 0.1, label: '0.1 0G' },
  { value: 1, label: '1 0G' },
  { value: 5, label: '5 0G' },
  { value: 10, label: '10 0G' },
];

interface LayoutContentProps {
  children: React.ReactNode;
}

const MainContentArea: React.FC<{ children: React.ReactNode; isHomePage: boolean }> = React.memo(({
  children,
  isHomePage
}) => {
  const { isNavigating, targetRoute } = useNavigation();

  if (isNavigating) {
    return (
      <div className="p-4">
        <SimpleLoader message={`Loading ${targetRoute || 'page'}...`} />
      </div>
    );
  }

  return (
    <div>
      {isHomePage ? (
        <div className="container mx-auto px-4 py-8">{children}</div>
      ) : (
        children
      )}
    </div>
  );
});

MainContentArea.displayName = 'MainContentArea';

export const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingNetwork } = useSwitchChain();
  const { broker, isInitializing, isChainSwitching } = useBroker();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Network-aware default values
  const isTestnet = chainId === zgTestnet.id;
  const minimumDeposit = isTestnet ? MINIMUM_DEPOSITS.INITIAL_TESTNET : MINIMUM_DEPOSITS.INITIAL_MAINNET;
  const defaultDeposit = isTestnet ? `${MINIMUM_DEPOSITS.INITIAL_TESTNET}` : `${MINIMUM_DEPOSITS.INITIAL_MAINNET}`;
  const defaultPreset = minimumDeposit;
  const depositPresets = isTestnet ? TESTNET_DEPOSIT_PRESETS : MAINNET_DEPOSIT_PRESETS;

  const [initialDeposit, setInitialDeposit] = useState<string>(defaultDeposit);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(defaultPreset);

  const handlePresetClick = (presetValue: number) => {
    setSelectedPreset(presetValue);
    setInitialDeposit(presetValue.toString());
    setError(null);
  };

  const handleCustomInput = (value: string) => {
    setInitialDeposit(value);
    setSelectedPreset(null);
    setError(null);
  };

  const lastCheckedStateRef = useRef<{
    pathname: string;
    chainId: number;
    checkedAt: number;
  } | null>(null);

  const previousChainIdRef = useRef<number | undefined>(undefined);
  const [isLocalChainSwitching, setIsLocalChainSwitching] = useState(false);

  useEffect(() => {
    if (previousChainIdRef.current === undefined) {
      previousChainIdRef.current = chainId;
    }
  }, [chainId]);

  useEffect(() => {
    if (previousChainIdRef.current !== undefined && previousChainIdRef.current !== chainId) {
      setIsLocalChainSwitching(true);
      setShowDepositModal(false);
      lastCheckedStateRef.current = null;

      // Reset deposit values to network-appropriate defaults
      setInitialDeposit(defaultDeposit);
      setSelectedPreset(defaultPreset);

      const resetTimer = setTimeout(() => {
        setIsLocalChainSwitching(false);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }

    previousChainIdRef.current = chainId;
  }, [chainId, defaultDeposit, defaultPreset]);

  useEffect(() => {
    const checkLedger = async () => {
      if (broker && isConnected && !isHomePage && !isInitializing && !isChainSwitching && !isLocalChainSwitching) {
        const now = Date.now();
        const lastChecked = lastCheckedStateRef.current;
        if (lastChecked && lastChecked.chainId !== chainId && (now - lastChecked.checkedAt) < 3000) {
          return;
        }

        if (lastChecked &&
            lastChecked.pathname === pathname &&
            lastChecked.chainId === chainId &&
            (now - lastChecked.checkedAt) < 5000) {
          return;
        }

        try {
          // Check if broker.ledger.ledger exists (nested ledger accessor)
          const ledgerAccessor = (broker.ledger as any)?.ledger;
          if (!ledgerAccessor?.getLedgerWithDetail) {
            setShowDepositModal(true);
            return;
          }
          const { ledgerInfo } = await ledgerAccessor.getLedgerWithDetail();
          // ledgerInfo[0] is totalBalance in neuron units
          const totalBalance = ledgerInfo ? BigInt(ledgerInfo[0]) : BigInt(0);
          if (totalBalance === BigInt(0)) {
            setShowDepositModal(true);
          } else {
            setShowDepositModal(false);
          }

          lastCheckedStateRef.current = {
            pathname,
            chainId,
            checkedAt: now,
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('network changed')) {
            return;
          }

          setShowDepositModal(true);

          lastCheckedStateRef.current = {
            pathname,
            chainId,
            checkedAt: now,
          };
        }
      }
    };

    checkLedger();
  }, [broker, isConnected, isHomePage, chainId, pathname, isInitializing, isChainSwitching, isLocalChainSwitching]);

  useEffect(() => {
    if (!isConnected) {
      setShowDepositModal(false);
      setError(null);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setError(null);
      setIsLoading(false);
      lastCheckedStateRef.current = null;
    }
  }, [chainId, isConnected]);

  useEffect(() => {
    if (isInitializing || isChainSwitching || isLocalChainSwitching) {
      setShowDepositModal(false);
    }
  }, [isInitializing, isChainSwitching, isLocalChainSwitching]);

  const handleCreateAccount = async () => {
    if (!broker) return;

    const depositAmount = parseFloat(initialDeposit);
    if (isNaN(depositAmount) || depositAmount < minimumDeposit) {
      setError(`Minimum deposit is ${minimumDeposit} 0G`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await broker.ledger.addLedger(depositAmount);
      setShowDepositModal(false);
      setInitialDeposit(defaultDeposit);
      setSelectedPreset(defaultPreset);
    } catch (err: unknown) {
      const errorMessage = formatBlockchainError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setError(null);
    setShowDepositModal(false);
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    await copyToClipboard(address);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSwitchNetwork = (targetChainId: number) => {
    if (switchChain && chainId !== targetChainId) {
      setError(null);
      switchChain({ chainId: targetChainId });
    }
  };

  const currentNetwork = chainId === zgMainnet.id ? zgMainnet : zgTestnet;
  const isMainnet = chainId === zgMainnet.id;

  return (
    <NavigationProvider>
      <MainContentArea isHomePage={isHomePage}>
        {children}
      </MainContentArea>

      {/* Global Account Creation Modal */}
      {showDepositModal && !isInitializing && !isChainSwitching && !isLocalChainSwitching && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2 whitespace-nowrap">
                Create Your Account
              </h3>
            </div>

            {/* Network Switcher */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network
              </label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => handleSwitchNetwork(zgMainnet.id)}
                  disabled={isSwitchingNetwork}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    isMainnet
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } ${isSwitchingNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSwitchingNetwork && !isMainnet ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent mr-1"></div>
                      Switching...
                    </span>
                  ) : (
                    'Mainnet'
                  )}
                </button>
                <button
                  onClick={() => handleSwitchNetwork(zgTestnet.id)}
                  disabled={isSwitchingNetwork}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    !isMainnet
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } ${isSwitchingNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSwitchingNetwork && isMainnet ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent mr-1"></div>
                      Switching...
                    </span>
                  ) : (
                    'Testnet'
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Current: {currentNetwork.name}
              </p>
            </div>

            {/* Wallet Info */}
            {address && (
              <div className="mb-4">
                <div className="text-center">
                  <div className="text-sm font-mono text-gray-900 mb-3">{formatAddress(address)}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyAddress}
                    className="flex-1 px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    Copy Address
                  </button>
                  <button
                    onClick={handleDisconnectWallet}
                    className="flex-1 px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* Quick preset amounts */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Amount
              </label>
              <div className="grid grid-cols-2 gap-2">
                {depositPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset.value)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedPreset === preset.value
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-semibold">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={minimumDeposit}
                  step="0.1"
                  value={initialDeposit}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder={`Enter amount (min ${minimumDeposit})`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  0G
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum deposit: {minimumDeposit} 0G
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-medium text-red-800 mb-1">Account Creation Failed</h4>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateAccount}
              disabled={isLoading || parseFloat(initialDeposit) < minimumDeposit || isNaN(parseFloat(initialDeposit))}
              className="w-full px-4 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </>
              ) : error ? (
                "Retry Creating Account"
              ) : (
                `Create Account with ${initialDeposit} 0G`
              )}
            </button>
          </div>
        </div>
      )}
    </NavigationProvider>
  );
};
