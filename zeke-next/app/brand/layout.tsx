import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import {
  HomeIcon,
  CampaignIcon,
  ChatIcon,
  DealsIcon,
  DiscoverIcon,
  ProfileIcon,
} from "@/components/layout/icons";

export default async function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("brand");
  const name = session.profile.display_name;
  const initials = name.slice(0, 2).toUpperCase();
  const sub = [session.brand?.brand_type, session.profile.location].filter(Boolean).join(" · ");

  const navItems = [
    { href: "/brand/overview", label: "Overview", icon: <HomeIcon /> },
    { href: "/brand/campaigns", label: "Campaigns", icon: <CampaignIcon /> },
    { href: "/brand/chats", label: "Chats", icon: <ChatIcon /> },
    { href: "/brand/deals", label: "Deals", icon: <DealsIcon /> },
    { href: "/brand/discover", label: "Discover Creators", icon: <DiscoverIcon /> },
    { href: "/brand/profile", label: "Brand Profile", icon: <ProfileIcon /> },
  ];

  const mobileItems = [
    { href: "/brand/overview", label: "Overview", icon: <HomeIcon width={18} height={18} /> },
    { href: "/brand/campaigns", label: "Campaigns", icon: <CampaignIcon width={18} height={18} /> },
    { href: "/brand/chats", label: "Chats", icon: <ChatIcon width={18} height={18} /> },
    { href: "/brand/deals", label: "Deals", icon: <DealsIcon width={18} height={18} /> },
    { href: "/brand/profile", label: "Profile", icon: <ProfileIcon width={18} height={18} /> },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <DashboardTopNav
        userId={session.id}
        homeHref="/brand/overview"
        dealHrefPrefix="/brand/deals"
        rightExtra={
          <Link href="/brand/campaigns" className="brand-button-primary hidden rounded-xl border px-4 py-2 text-xs font-bold text-white sm:inline">
            + New Campaign
          </Link>
        }
      />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar
          avatarInitials={initials}
          avatarClassName="brand-avatar border"
          name={name}
          sub={sub || "Brand"}
          navItems={navItems}
        />
        <main className="dashboard-content min-w-0 flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-[1280px] p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}
