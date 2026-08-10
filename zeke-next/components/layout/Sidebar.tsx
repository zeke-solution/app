"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: ReactNode;
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
  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + "/"),
  );

  return (
    <aside className="brand-sidebar hidden w-56 flex-shrink-0 flex-col gap-1 border-r p-4 md:flex">
      <div className="mb-3 flex items-center gap-2.5 border-b border-border px-2 pb-5">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cover bg-center text-xs font-black ${avatarClassName}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {!avatarUrl && avatarInitials}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{name}</div>
          <div className="text-[11px] text-muted">{sub}</div>
        </div>
      </div>

      {navItems.map((item, index) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const transitionType = index < activeIndex ? "dashboard-back" : "dashboard-forward";
        return (
          <Link
            key={item.href}
            href={item.href}
            transitionTypes={active ? undefined : [transitionType]}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "brand-nav-active" : "text-muted hover:bg-white/5 hover:text-light"
            }`}
          >
            {item.icon}
            {item.label}
            {!!item.count && (
              <span
                className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: item.countColor ?? "#6366F1" }}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-1">
        <SignOutButton fullWidth />
      </div>
    </aside>
  );
}
