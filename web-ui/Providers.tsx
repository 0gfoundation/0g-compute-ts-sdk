"use client";

import { RainbowProvider } from "./src/shared/providers/RainbowProvider";
import { BrokerProvider } from "./src/shared/providers/BrokerProvider";
import { DepositGuardProvider } from "./src/shared/providers/DepositGuardProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <BrokerProvider>
        <DepositGuardProvider>{children}</DepositGuardProvider>
      </BrokerProvider>
    </RainbowProvider>
  );
}
