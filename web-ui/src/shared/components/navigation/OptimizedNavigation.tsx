"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface OptimizedLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  preload?: boolean;
  onNavigationStart?: () => void;
}

// Use native <a> tag instead of Next.js Link/router to avoid RSC .txt navigation issues in static export
export const OptimizedLink: React.FC<OptimizedLinkProps> = ({
  href,
  className,
  children,
  onNavigationStart,
}) => {
  const [isNavigating] = useState(false);

  const handleClick = () => {
    if (isNavigating) return;
    onNavigationStart?.();
    // Let native browser navigation handle it
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

// Navigation loading context
import { createContext, useContext, useRef, useMemo } from "react";

interface NavigationState {
  isNavigating: boolean;
  targetRoute: string | null;
  targetPageType: string | null;
}

interface NavigationContextValue extends NavigationState {
  setIsNavigating: (value: boolean) => void;
  setTargetRoute: (route: string | null) => void;
  setTargetPageType: (type: string | null) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    targetRoute: null,
    targetPageType: null,
  });
  
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only reset state on actual route changes
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Clear any existing timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        resetTimerRef.current = setTimeout(() => {
          setNavigationState({
            isNavigating: false,
            targetRoute: null,
            targetPageType: null,
          });
        }, 300);
      });
    }
    
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [pathname]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<NavigationContextValue>(() => ({
    ...navigationState,
    setIsNavigating: (value: boolean) => 
      setNavigationState(prev => ({ ...prev, isNavigating: value })),
    setTargetRoute: (route: string | null) => 
      setNavigationState(prev => ({ ...prev, targetRoute: route })),
    setTargetPageType: (type: string | null) => 
      setNavigationState(prev => ({ ...prev, targetPageType: type })),
  }), [navigationState]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
