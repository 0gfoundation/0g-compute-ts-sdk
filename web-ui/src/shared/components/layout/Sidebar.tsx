"use client";

import { usePathname } from "next/navigation";
import { MessageSquare, Wallet, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const links: SidebarLink[] = [
  { href: "/inference", label: "Inference", icon: MessageSquare },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r border-border bg-card sm:flex">
      <nav className="flex flex-col items-center gap-3 px-2 sm:py-5">
        <TooltipProvider>
          {links.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                {/* Use native <a> tag instead of Next.js Link to avoid RSC .txt navigation issues in static export */}
                <a
                  href={href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-primary hover:bg-secondary",
                    isActive(href) && "bg-primary text-primary-foreground shadow-glow"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-card border-border">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}

export { Sidebar as default };
