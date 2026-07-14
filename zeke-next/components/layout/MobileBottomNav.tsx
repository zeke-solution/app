"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface MobileNavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

// Port of .mob-bottom-nav from css/zeke.css. Note the legacy app deliberately
// shows fewer items here than in the full sidebar (e.g. creator.html omits
// Agreements from the mobile nav) — pass only the subset you want.
export function MobileBottomNav({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex border-t border-accent/10 bg-navy py-2.5 pb-[max(env(safe-area-inset-bottom),14px)] md:hidden">
      <div className="flex w-full items-center justify-evenly">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex max-w-20 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
