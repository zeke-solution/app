import Link from "next/link";
import type { ReactNode } from "react";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { SignOutButton } from "@/components/auth/SignOutButton";

// Port of #top-nav as it appears on creator.html/brand.html/admin.html
// (logo + optional badge slot + notif bell + sign out).
export function DashboardTopNav({
  userId,
  dealHrefPrefix,
  badge,
  rightExtra,
}: {
  userId: string;
  dealHrefPrefix: string;
  badge?: ReactNode;
  rightExtra?: ReactNode;
}) {
  return (
    <nav className="brand-nav sticky top-0 z-40 border-b border-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="brand-wordmark text-[22px] text-white">
          zeke<span className="brand-wordmark-accent">.</span>
        </Link>
        <div className="flex items-center gap-3">
          {badge}
          {rightExtra}
          <NotificationsPanel userId={userId} dealHrefPrefix={dealHrefPrefix} />
          <SignOutButton iconOnly />
        </div>
      </div>
    </nav>
  );
}
