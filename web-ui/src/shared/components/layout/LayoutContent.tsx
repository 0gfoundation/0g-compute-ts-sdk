"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { Sidebar } from "./Sidebar";
import { use0GBroker } from "../../hooks/use0GBroker";
import { NavigationProvider, useNavigation } from "../navigation/OptimizedNavigation";
import SimpleLoader from "../ui/SimpleLoader";

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
      <main className="p-4">
        <SimpleLoader message={`Loading ${targetRoute || 'page'}...`} />
      </main>
    );
  }

  return (
    <main className="p-4">
      {isHomePage ? (
        <div className="container mx-auto px-4 py-8">{children}</div>
      ) : (
        children
      )}
    </main>
  );
});

MainContentArea.displayName = 'MainContentArea';

export const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { broker, isInitializing, isChainSwitching, error: brokerError } = use0GBroker();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDeposit, setInitialDeposit] = useState<string>("3");
  
  // Track last checked state to avoid redundant checks (using ref to avoid triggering re-renders)
  const lastCheckedStateRef = useRef<{
    pathname: string;
    chainId: number;
    checkedAt: number;
  } | null>(null);
  
  // Track previous chainId to detect chain switching locally
  const previousChainIdRef = useRef<number | undefined>(undefined); // Start as undefined
  const [isLocalChainSwitching, setIsLocalChainSwitching] = useState(false);
  
  // Initialize previous chainId ref on mount
  useEffect(() => {
    if (previousChainIdRef.current === undefined) {
      previousChainIdRef.current = chainId;
    }
  }, [chainId]);

  // Detect chain switching immediately when chainId changes
  useEffect(() => {
    if (previousChainIdRef.current !== undefined && previousChainIdRef.current !== chainId) {
      // Chain is switching - immediately hide modals and set switching state
      setIsLocalChainSwitching(true);
      setShowDepositModal(false);
      
      // Clear last checked state
      lastCheckedStateRef.current = null;
      
      // Reset switching state after broker has time to initialize
      const resetTimer = setTimeout(() => {
        setIsLocalChainSwitching(false);
      }, 2000); // Give broker time to initialize
      
      return () => clearTimeout(resetTimer);
    }
    
    // Update previous chainId
    previousChainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    const checkLedger = async () => {
      // Wait until broker is fully ready (not initializing and not chain switching)
      // Also add a small delay to ensure broker has synced with the new network
      if (broker && isConnected && !isHomePage && !isInitializing && !isChainSwitching && !isLocalChainSwitching) {
        // Additional check: ensure we're not too close to the last chain change
        const now = Date.now();
        const lastChecked = lastCheckedStateRef.current;
        if (lastChecked && lastChecked.chainId !== chainId && (now - lastChecked.checkedAt) < 3000) {
          return;
        }
        
        // Skip check if we recently checked the same state
        if (lastChecked && 
            lastChecked.pathname === pathname && 
            lastChecked.chainId === chainId &&
            (now - lastChecked.checkedAt) < 5000) { // 5 second cooldown for same state
          return;
        }
        
        try {
          const ledger = await broker.ledger.getLedger();
          // If we get here, it means ledger exists and has data
          // Check if the balance is valid (totalBalance > 0 indicates a real ledger)
          if (!ledger || ledger.totalBalance === BigInt(0)) {
            setShowDepositModal(true);
          } else {
            // Ledger exists and has balance, hide modal
            setShowDepositModal(false);
          }
          
          // Update last checked state
          lastCheckedStateRef.current = {
            pathname,
            chainId,
            checkedAt: now,
          };
        } catch (error) {
          // Check if error is due to network change (chain switching)
          if (error instanceof Error && error.message.includes('network changed')) {
            // Don't show modal for network change errors, just wait
            return;
          }
          
          // For other errors (e.g., ledger does not exist), prompt for deposit
          setShowDepositModal(true);
          
          // Update last checked state even on error
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

  // Clear modals and errors when wallet is disconnected
  useEffect(() => {
    if (!isConnected) {
      setShowDepositModal(false);
      setError(null);
    }
  }, [isConnected]);

  // Reset state when network changes to ensure clean state for new network
  useEffect(() => {
    if (isConnected) {
      setError(null);
      setIsLoading(false);
      // Clear last checked state when chain changes to force a new check
      lastCheckedStateRef.current = null;
    }
  }, [chainId, isConnected]);

  // Hide modal during initialization and chain switching to prevent flickering
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
      // Reset initial deposit for next time
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
    
    try {
      await navigator.clipboard.writeText(address);
      // Optional: You could add a toast notification here
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <NavigationProvider>
      <div className={`min-h-screen bg-gray-50 ${isHomePage ? "pt-20" : "pl-52 pt-20"}`}>
        {isHomePage ? null : <Sidebar />}
        <MainContentArea isHomePage={isHomePage}>
          {children}
        </MainContentArea>
      </div>

      {/* Global Account Creation Modal - only show when broker is fully ready */}
      {showDepositModal && !isInitializing && !isChainSwitching && !isLocalChainSwitching && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2 whitespace-nowrap">
                Create Your Account
              </h3>
            </div>

            {/* Wallet Info */}
            {address && (
              <div className="mb-6">
                <div className="text-center">
                  <div className="text-sm font-mono text-gray-900 mb-4">{formatAddress(address)}</div>
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
