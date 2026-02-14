import { useEffect, useRef } from 'react';

interface UseChainRestoreOptions {
  isConnected: boolean;
  currentChainId: number;
  switchChain?: (params: { chainId: number }) => void;
}

interface UseChainRestoreReturn {
  shouldSkipInit: boolean;
  hasRestored: boolean;
}

const PREFERRED_CHAIN_KEY = '0g_preferred_chain_id';

/**
 * Hook to handle chain restoration after wallet reconnection
 *
 * Behavior:
 * - On first connection after wallet reconnect: restore previously used chain from localStorage
 * - Returns shouldSkipInit=true during restoration to prevent wrong-chain broker initialization
 * - Persists chain preference to localStorage when connected
 *
 * @param options - Configuration options
 * @returns Object with shouldSkipInit and hasRestored flags
 */
export function useChainRestore({
  isConnected,
  currentChainId,
  switchChain,
}: UseChainRestoreOptions): UseChainRestoreReturn {
  const chainRestoreCheckedRef = useRef(false);
  const skipChainRestoreRef = useRef(false);
  const hasRestoredChainRef = useRef(false);

  // Effect: Manage chain-restore state based on connection status
  useEffect(() => {
    if (!isConnected) {
      chainRestoreCheckedRef.current = false;
      skipChainRestoreRef.current = false;
    } else if (!chainRestoreCheckedRef.current) {
      chainRestoreCheckedRef.current = true;
      try {
        const stored = localStorage.getItem(PREFERRED_CHAIN_KEY);
        skipChainRestoreRef.current = !!stored && Number(stored) !== currentChainId;
      } catch {
        skipChainRestoreRef.current = false;
      }
    } else {
      skipChainRestoreRef.current = false;
    }
  }, [isConnected, currentChainId]);

  // Effect: Restore preferred chain after wallet reconnection
  useEffect(() => {
    if (!isConnected) {
      hasRestoredChainRef.current = false;
      return;
    }
    if (hasRestoredChainRef.current) return;

    const restore = async () => {
      try {
        const stored = localStorage.getItem(PREFERRED_CHAIN_KEY);
        if (!stored) {
          hasRestoredChainRef.current = true;
          return;
        }

        const preferredChainId = Number(stored);
        if (preferredChainId && preferredChainId !== currentChainId && switchChain) {
          switchChain({ chainId: preferredChainId });
        }

        hasRestoredChainRef.current = true;
      } catch (err) {
        console.warn('[useChainRestore] Failed to restore chain:', err);
        hasRestoredChainRef.current = true;
      }
    };

    restore();
  }, [isConnected, currentChainId, switchChain]);

  // Effect: Persist preferred chain (after restoration completes)
  useEffect(() => {
    if (!isConnected || !hasRestoredChainRef.current) return;

    try {
      localStorage.setItem(PREFERRED_CHAIN_KEY, String(currentChainId));
    } catch {
      // localStorage unavailable
    }
  }, [currentChainId, isConnected]);

  return {
    shouldSkipInit: skipChainRestoreRef.current,
    hasRestored: hasRestoredChainRef.current,
  };
}
