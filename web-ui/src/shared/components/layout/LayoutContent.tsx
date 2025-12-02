"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { use0GBroker } from "../../hooks/use0GBroker";
import { NavigationProvider, useNavigation } from "../navigation/OptimizedNavigation";
import SimpleLoader from "../ui/SimpleLoader";
import { copyToClipboard } from "@/lib/utils";
import { zgTestnet, zgMainnet } from "../../config/wagmi";

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
  const { broker, isInitializing, isChainSwitching } = use0GBroker();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDeposit, setInitialDeposit] = useState<string>("3");

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

      const resetTimer = setTimeout(() => {
        setIsLocalChainSwitching(false);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }

    previousChainIdRef.current = chainId;
  }, [chainId]);

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
          const ledger = await broker.ledger.getLedger();
          if (!ledger || ledger.totalBalance === BigInt(0)) {
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
    if (isNaN(depositAmount) || depositAmount < 3) {
      setError('Minimum deposit is 3 0G');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await broker.ledger.addLedger(depositAmount);
      setShowDepositModal(false);
      setInitialDeposit("3");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
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

            {/* Initial Deposit Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Deposit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="3"
                  step="0.1"
                  value={initialDeposit}
                  onChange={(e) => {
                    setInitialDeposit(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter amount (min 3)"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  0G
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum deposit: 3 0G
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
              disabled={isLoading || parseFloat(initialDeposit) < 3 || isNaN(parseFloat(initialDeposit))}
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
