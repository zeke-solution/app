import { requireRole } from "@/lib/auth/roles";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import {
  HomeIcon,
  OffersIcon,
  ChatIcon,
  DealsIcon,
  AgreementIcon,
  ProfileIcon,
  ShieldIcon,
} from "@/components/layout/icons";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("influencer");
  const name = session.profile.display_name;
  const initials = name.slice(0, 2).toUpperCase();
  const handle = session.inf?.handle ? `@${session.inf.handle.replace("@", "")}` : (session.inf?.niche ?? "--");
  const isShield = isShieldMembershipActive(session.inf);

  const navItems = [
    { href: "/creator/overview", label: "Home", icon: <HomeIcon /> },
    { href: "/creator/offers", label: "Offers", icon: <OffersIcon /> },
    { href: "/creator/chats", label: "Chats", icon: <ChatIcon /> },
    { href: "/creator/deals", label: "Deals", icon: <DealsIcon /> },
    { href: "/creator/agreements", label: "Agreements", icon: <AgreementIcon /> },
    { href: "/creator/shield", label: "Zeke Shield", icon: <ShieldIcon /> },
    { href: "/creator/profile", label: "My Profile", icon: <ProfileIcon /> },
  ];

  const mobileItems = [
    { href: "/creator/overview", label: "Home", icon: <HomeIcon width={18} height={18} /> },
    { href: "/creator/offers", label: "Offers", icon: <OffersIcon width={18} height={18} /> },
    { href: "/creator/chats", label: "Chats", icon: <ChatIcon width={18} height={18} /> },
    { href: "/creator/deals", label: "Deals", icon: <DealsIcon width={18} height={18} /> },
    { href: "/creator/profile", label: "Profile", icon: <ProfileIcon width={18} height={18} /> },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <DashboardTopNav
        userId={session.id}
        homeHref="/creator/overview"
        dealHrefPrefix="/creator/deals"
        badge={
          <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs font-semibold text-muted">
            {isShield ? "🛡 Shield" : "Free Creator"}
          </span>
        }
      />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar avatarInitials={initials} avatarUrl={session.profile.avatar_url} name={name} sub={handle} navItems={navItems} />
        <main className="dashboard-content min-w-0 flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-[1280px] p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}
