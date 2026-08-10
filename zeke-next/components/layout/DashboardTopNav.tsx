import Link from "next/link";
import type { ReactNode } from "react";
import { DeferredNotificationsPanel } from "@/components/layout/DeferredNotificationsPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Port of #top-nav as it appears on creator.html/brand.html/admin.html
// (logo + optional badge slot + notification bell).
export function DashboardTopNav({
  userId,
  homeHref,
  dealHrefPrefix,
  badge,
  rightExtra,
}: {
  userId: string;
  homeHref: string;
  dealHrefPrefix: string;
  badge?: ReactNode;
  rightExtra?: ReactNode;
}) {
  return (
    <nav className="brand-nav sticky top-0 z-40 border-b border-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href={homeHref} aria-label="Zeke dashboard home" className="inline-flex">
          <BrandLogo className="w-[82px]" preload />
        </Link>
        <div className="flex items-center gap-3">
          {badge}
          {rightExtra}
          <DeferredNotificationsPanel userId={userId} dealHrefPrefix={dealHrefPrefix} />
        </div>
      </div>
    </nav>
  );
}
