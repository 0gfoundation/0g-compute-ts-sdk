// Chain-aware cache implementation
class ChainAwareDataCache {
  private cache = new Map<string, Map<string, { data: unknown; timestamp: number; ttl: number }>>();
  private currentChainId: number | undefined;

  setCurrentChain(chainId: number | undefined): void {
    this.currentChainId = chainId;
  }

  private getChainCache(chainId?: number): Map<string, { data: unknown; timestamp: number; ttl: number }> {
    const effectiveChainId = chainId ?? this.currentChainId ?? 0;
    const chainKey = effectiveChainId.toString();

    if (!this.cache.has(chainKey)) {
      this.cache.set(chainKey, new Map());
    }
    return this.cache.get(chainKey)!;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000, chainId?: number): void {
    const chainCache = this.getChainCache(chainId);
    chainCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string, chainId?: number): T | null {
    const chainCache = this.getChainCache(chainId);
    const cached = chainCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      chainCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  clear(key?: string, chainId?: number): void {
    if (chainId !== undefined) {
      const chainKey = chainId.toString();
      if (key) {
        const chainCache = this.cache.get(chainKey);
        if (chainCache) {
          chainCache.delete(key);
        }
      } else {
        this.cache.delete(chainKey);
      }
    } else if (key) {
      const chainCache = this.getChainCache();
      chainCache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clearChain(chainId: number): void {
    this.cache.delete(chainId.toString());
  }
}

export const dataCache = new ChainAwareDataCache();

export const setCurrentChainInCache = (chainId: number | undefined) => {
  dataCache.setCurrentChain(chainId);
};

export const clearDataCache = (key?: string, chainId?: number) => {
  dataCache.clear(key, chainId);
};

export const clearChainCache = (chainId: number) => {
  dataCache.clearChain(chainId);
};
