"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useChainId } from "wagmi";
import { useBroker } from "./BrokerProvider";
import { DepositModal } from "../components/DepositModal";
import type { LedgerInfo } from "./BrokerProvider";

// Returns true only when ledgerInfo definitively shows zero balance.
// Returns false for null (unknown state) to avoid false positives during
// loading or network failures.
function needsDeposit(ledgerInfo: LedgerInfo | null): boolean {
  if (!ledgerInfo) return false;
  return ledgerInfo.totalBalance === "0";
}

interface DepositGuardContextValue {
  requestDeposit: () => Promise<void>;
}

const DepositGuardContext = createContext<DepositGuardContextValue>({
  requestDeposit: () => Promise.resolve(),
});

export function useDepositGuard(): DepositGuardContextValue {
  return useContext(DepositGuardContext);
}

export function DepositGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { broker, isInitializing, ledgerInfo } = useBroker();
  const chainId = useChainId();

  const [showModal, setShowModal] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  // Track whether the proactive prompt was dismissed this session per chain
  const dismissedRef = useRef(false);
  const lastProactiveChainRef = useRef<number | undefined>(undefined);

  // Pending promise for action-required mode
  const pendingRef = useRef<{
    resolve: () => void;
    reject: (e: Error) => void;
  } | null>(null);

  // Proactive trigger: show dismissable modal after wallet connects with zero balance
  useEffect(() => {
    if (!broker || isInitializing) return;

    // Reset dismissed state when chain actually changes
    if (lastProactiveChainRef.current !== undefined && lastProactiveChainRef.current !== chainId) {
      dismissedRef.current = false;
    }
    lastProactiveChainRef.current = chainId;

    if (dismissedRef.current) return;
    if (!needsDeposit(ledgerInfo)) return;

    // Only proactively prompt if ledgerInfo is definitively zero-balance
    // (not null, which could be a fetch failure for new accounts)
    if (ledgerInfo && ledgerInfo.totalBalance === "0") {
      setShowModal(true);
    }
  }, [broker, isInitializing, ledgerInfo, chainId]);

  // Action-required: returns a Promise that resolves after successful deposit
  const requestDeposit = useCallback((): Promise<void> => {
    // Explicitly handle null case - account state unknown
    if (!ledgerInfo) {
      console.warn('[DepositGuard] Account state unknown, cannot determine deposit need');
      return Promise.resolve();
    }

    if (!needsDeposit(ledgerInfo)) return Promise.resolve();

    // Reject any existing pending promise before creating a new one
    if (pendingRef.current) {
      pendingRef.current.reject(new Error("superseded"));
      pendingRef.current = null;
    }

    return new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setShowModal(true);
    });
  }, [ledgerInfo]);

  const handleDeposit = useCallback(() => {
    pendingRef.current?.resolve();
    pendingRef.current = null;
    dismissedRef.current = true;
    setIsDepositing(false);
    setShowModal(false);
  }, []);

  const handleCancel = useCallback(() => {
    // Block cancel while a transaction is in progress
    if (isDepositing) return;

    pendingRef.current?.reject(new Error("cancelled"));
    pendingRef.current = null;
    dismissedRef.current = true;
    setShowModal(false);
  }, [isDepositing]);

  // Cleanup pending promise on unmount
  useEffect(() => {
    return () => {
      pendingRef.current?.reject(new Error("unmounted"));
      pendingRef.current = null;
    };
  }, []);

  return (
    <DepositGuardContext.Provider value={{ requestDeposit }}>
      {children}
      <DepositModal
        open={showModal}
        onDeposit={handleDeposit}
        onCancel={handleCancel}
        onLoadingChange={setIsDepositing}
      />
    </DepositGuardContext.Provider>
  );
}
