"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
      <div className="p-4">
        <SimpleLoader message={`Loading ${targetRoute || 'page'}...`} />
      </div>
    );
  }

  return (
    <div>
      {isHomePage ? (
        <div className="container mx-auto px-4 py-8">{children}</div>
      ) : (
        children
      )}
    </div>
  );
});

MainContentArea.displayName = 'MainContentArea';

export const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <NavigationProvider>
      <MainContentArea isHomePage={isHomePage}>
        {children}
      </MainContentArea>
    </NavigationProvider>
  );
};
