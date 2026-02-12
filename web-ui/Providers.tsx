"use client";

import { RainbowProvider } from "./src/shared/providers/RainbowProvider";
import { BrokerProvider } from "./src/shared/providers/BrokerProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <BrokerProvider>{children}</BrokerProvider>
    </RainbowProvider>
  );
}
