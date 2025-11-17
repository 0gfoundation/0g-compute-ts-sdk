"use client";

import '@rainbow-me/rainbowkit/styles.css';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../config/wagmi';

// Create instances outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Memoize theme configuration
const RAINBOW_THEME = lightTheme({
  accentColor: '#9333ea',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Memoize app info
const APP_INFO = {
  appName: '0G Compute Network',
  learnMoreUrl: 'https://0g.ai',
} as const;

interface RainbowProviderProps {
  children: React.ReactNode;
}

export const RainbowProvider = React.memo<RainbowProviderProps>(({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={RAINBOW_THEME}
          locale="en-US"
          showRecentTransactions={true}
          appInfo={APP_INFO}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
});

RainbowProvider.displayName = 'RainbowProvider';
