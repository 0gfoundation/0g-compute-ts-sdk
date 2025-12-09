"use client";

import React from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Github, Globe } from "lucide-react";

const CONNECT_BUTTON_CONFIG = {
  chainStatus: "icon" as const,
  accountStatus: {
    smallScreen: 'avatar' as const,
    largeScreen: 'full' as const,
  },
  showBalance: {
    smallScreen: false,
    largeScreen: true,
  }
} as const;

const GitHubLink = React.memo(() => (
  <a
    href="https://github.com/0glabs/0g-serving-user-broker"
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
  >
    <Github className="w-5 h-5" />
  </a>
));

const WebsiteLink = React.memo(() => (
  <a
    href="https://hub.0g.ai/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
  >
    <Globe className="w-5 h-5" />
  </a>
));

GitHubLink.displayName = 'GitHubLink';
WebsiteLink.displayName = 'WebsiteLink';

// Use native <a> tag instead of Next.js Link to avoid RSC .txt navigation issues in static export
const NavbarLogo = React.memo(() => (
  <a href="/" className="flex items-center space-x-2">
    <img src="/favicon.svg" alt="0G" className="w-8 h-8" />
    <span className="hidden sm:inline text-xl font-bold text-gray-800">Compute Network</span>
    <span className="hidden md:inline ml-2 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full border border-purple-200">
      beta
    </span>
  </a>
));

NavbarLogo.displayName = 'NavbarLogo';

export const Navbar: React.FC = React.memo(() => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-purple-200 bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <NavbarLogo />

      <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
        <div className="hidden sm:flex items-center space-x-3">
          <GitHubLink />
          <WebsiteLink />
        </div>

        <ConnectButton {...CONNECT_BUTTON_CONFIG} />
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
