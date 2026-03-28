"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Flame,
  LineChart,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", href: "/portfolio", icon: BarChart3 },
  { label: "Equities", href: "/equities", icon: TrendingUp },
  { label: "Fixed Income", href: "/fixed-income", icon: LineChart },
  { label: "Inflation", href: "/inflation", icon: Flame },
  { label: "Risk", href: "/risk", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <span className="font-bold text-white tracking-tight">QUANT</span>
        <span className="ml-1 font-bold text-zinc-400 tracking-tight">HECHTON</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-800 p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
