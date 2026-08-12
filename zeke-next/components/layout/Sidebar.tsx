"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  activePrefixes?: string[];
  /** Shown as a small pill (e.g. unread/active counts). */
  count?: number;
  countColor?: string;
}

// Generic port of .sidebar/.sidebar-nav-btn from css/zeke.css - takes nav
// items as props so creator/brand/admin dashboards all reuse this.
export function Sidebar({
  avatarInitials,
  avatarUrl,
  avatarClassName = "bg-accent/20 border border-accent/30 text-accent",
  name,
  sub,
  navItems,
}: {
  avatarInitials: string;
  avatarUrl?: string | null;
  avatarClassName?: string;
  name: string;
  sub: string;
  navItems: SidebarNavItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="brand-sidebar hidden w-[72px] flex-shrink-0 flex-col gap-1 overflow-y-auto border-r p-2 md:flex lg:w-60 lg:p-4">
      <div className="mb-3 flex items-center justify-center gap-2.5 border-b border-border px-1 pb-5 lg:justify-start lg:px-2">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cover bg-center text-xs font-black ${avatarClassName}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {!avatarUrl && avatarInitials}
        </div>
        <div className="hidden min-w-0 lg:block">
          <div className="truncate text-sm font-bold text-white">{name}</div>
          <div className="truncate text-[11px] text-muted">{sub}</div>
        </div>
      </div>

      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          pathname?.startsWith(item.href + "/") ||
          item.activePrefixes?.some(
            (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/"),
          );
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex items-center justify-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors lg:justify-start lg:px-3 ${
              active ? "brand-nav-active" : "text-muted hover:bg-white/5 hover:text-light"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="sr-only lg:not-sr-only">{item.label}</span>
            {!!item.count && (
              <span
                className="ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white lg:inline-flex"
                style={{ background: item.countColor ?? "#6366F1" }}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-1">
        <div className="flex justify-center lg:hidden">
          <SignOutButton iconOnly />
        </div>
        <div className="hidden lg:block">
          <SignOutButton fullWidth />
        </div>
      </div>
    </aside>
  );
}
