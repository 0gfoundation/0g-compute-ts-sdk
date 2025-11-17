import { useState, useEffect, useCallback, useRef } from 'react';

interface DataFetchingOptions<T> {
  fetchFn: () => Promise<T>;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
  dependencies?: unknown[];
  initialData?: T | null;
  skip?: boolean;
}

interface DataFetchingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

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
  
  // Clear cache for specific chain or specific key
  clear(key?: string, chainId?: number): void {
    if (chainId !== undefined) {
      // Clear specific chain's cache
      const chainKey = chainId.toString();
      if (key) {
        // Clear specific key in specific chain
        const chainCache = this.cache.get(chainKey);
        if (chainCache) {
          chainCache.delete(key);
        }
      } else {
        // Clear entire chain cache
        this.cache.delete(chainKey);
      }
    } else if (key) {
      // Clear specific key from current chain
      const chainCache = this.getChainCache();
      chainCache.delete(key);
    } else {
      // Clear all caches
      this.cache.clear();
    }
  }
  
  // Clear cache for a specific chain when switching
  clearChain(chainId: number): void {
    this.cache.delete(chainId.toString());
  }
}

const dataCache = new ChainAwareDataCache();

// Export function to update current chain in cache
export const setCurrentChainInCache = (chainId: number | undefined) => {
  dataCache.setCurrentChain(chainId);
};

export function useOptimizedDataFetching<T>({
  fetchFn,
  cacheKey,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  dependencies = [],
  initialData = null,
  skip = false,
  chainId,
}: DataFetchingOptions<T> & { chainId?: number }): DataFetchingResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the current request to prevent race conditions
  const currentRequestRef = useRef<symbol | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (skipCache = false) => {
    if (skip) return;

    // Check cache first if cacheKey is provided and we're not skipping cache
    if (!skipCache && cacheKey) {
      const cachedData = dataCache.get<T>(cacheKey, chainId);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const currentRequest = Symbol('currentRequest');
    currentRequestRef.current = currentRequest;
    
    (async () => {
      try {
        const result = await fetchFn();
        
        // Only update state if this component is still mounted and this is the current request
        if (mountedRef.current && currentRequestRef.current === currentRequest) {
          setData(result);
          setError(null);
          
          // Cache the result if cacheKey is provided
          if (cacheKey) {
            dataCache.set(cacheKey, result, cacheTTL, chainId);
          }
        }
      } catch (err) {
        if (mountedRef.current && currentRequestRef.current === currentRequest) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
          setData(null);
        }
      } finally {
        if (mountedRef.current && currentRequestRef.current === currentRequest) {
          setLoading(false);
        }
      }
    })();

    return currentRequest;
  }, [fetchFn, cacheKey, cacheTTL, skip]);

  const refetch = useCallback(async () => {
    await fetchData(true); // Skip cache on manual refetch
  }, [fetchData]);

  // Effect for dependency-based fetching
  useEffect(() => {
    if (!skip) {
      fetchData();
    }
    
    return () => {
      currentRequestRef.current = null;
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Hook for parallel data fetching
export function useParallelDataFetching<T extends Record<string, unknown>>(
  fetchFunctions: Record<keyof T, () => Promise<T[keyof T]>>,
  options: {
    skip?: boolean;
    dependencies?: unknown[];
  } = {}
) {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    if (options.skip) return;

    setLoading(true);
    setError(null);

    try {
      const promises = Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
        try {
          const result = await (fetchFn as () => Promise<unknown>)();
          return [key, result];
        } catch (err) {
          return [key, null];
        }
      });

      const results = await Promise.all(promises);
      
      if (mountedRef.current) {
        const newData: Partial<T> = {};
        results.forEach(([key, value]) => {
          newData[key as keyof T] = value as T[keyof T];
        });
        setData(newData);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunctions, options.skip]);

  useEffect(() => {
    fetchAll();
  }, options.dependencies || []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
  };
}

// Clear cache utilities
export const clearDataCache = (key?: string, chainId?: number) => {
  dataCache.clear(key, chainId);
};

export const clearChainCache = (chainId: number) => {
  dataCache.clearChain(chainId);
};