import { useEffect, useRef, useState } from 'react';
import type { ZGComputeNetworkReadOnlyBroker } from '@0glabs/0g-serving-broker';
import { createZGComputeNetworkReadOnlyBroker } from '@0glabs/0g-serving-broker';
import { zgMainnet, zgTestnet } from '../config/wagmi';

function getRpcUrl(chainId: number): string {
  if (chainId === zgTestnet.id) {
    return zgTestnet.rpcUrls.default.http[0];
  }
  if (chainId !== zgMainnet.id) {
    console.warn(`[useReadOnlyBroker] Unknown chainId ${chainId}, falling back to mainnet RPC`);
  }
  return zgMainnet.rpcUrls.default.http[0];
}

interface UseReadOnlyBrokerOptions {
  chainId: number;
  enabled?: boolean;
}

/**
 * Hook to manage read-only broker for browsing services without wallet connection
 *
 * @param options - Configuration options
 * @returns Read-only broker instance or null
 */
export function useReadOnlyBroker({
  chainId,
  enabled = true,
}: UseReadOnlyBrokerOptions): ZGComputeNetworkReadOnlyBroker | null {
  const [readOnlyBroker, setReadOnlyBroker] = useState<ZGComputeNetworkReadOnlyBroker | null>(null);
  const readOnlyChainIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const targetChainId = chainId || zgMainnet.id;
    if (readOnlyChainIdRef.current === targetChainId && readOnlyBroker) return;

    readOnlyChainIdRef.current = targetChainId;

    let cancelled = false;
    const init = async () => {
      try {
        const rpcUrl = getRpcUrl(targetChainId);
        const instance = await createZGComputeNetworkReadOnlyBroker(rpcUrl, targetChainId);
        if (!cancelled) setReadOnlyBroker(instance);
      } catch (err) {
        console.warn('[useReadOnlyBroker] Init failed:', err);
      }
    };
    init();

    return () => {
      cancelled = true;
    };
  }, [chainId, enabled, readOnlyBroker]);

  return readOnlyBroker;
}
