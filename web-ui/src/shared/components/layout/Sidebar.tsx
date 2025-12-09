"use client";

import { usePathname } from "next/navigation";
import { useChainId } from "wagmi";
import { MessageSquare, SlidersHorizontal, Wallet, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const allLinks: SidebarLink[] = [
  { href: "/inference", label: "Inference", icon: MessageSquare },
  { href: "/fine-tuning", label: "Fine-tuning", icon: SlidersHorizontal },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const chainId = useChainId();

  // Filter out fine-tuning when on mainnet (chain ID 16661)
  const links = allLinks.filter(link =>
    link.href !== "/fine-tuning" || chainId !== 16661
  );

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r border-purple-200 bg-white sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          {links.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                {/* Use native <a> tag instead of Next.js Link to avoid RSC .txt navigation issues in static export */}
                <a
                  href={href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-900 md:h-8 md:w-8",
                    isActive(href) && "bg-purple-100 text-purple-700"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}

export { Sidebar as default };
