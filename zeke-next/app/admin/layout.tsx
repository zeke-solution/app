import { requireRole } from "@/lib/auth/roles";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { GridIcon, UsersIcon, ShieldIcon, DisputeIcon, ListIcon } from "@/components/layout/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");

  const navItems = [
    { href: "/admin/overview", label: "Overview", icon: <GridIcon /> },
    { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
    { href: "/admin/shield", label: "Shield Requests", icon: <ShieldIcon /> },
    { href: "/admin/disputes", label: "Disputes", icon: <DisputeIcon /> },
    { href: "/admin/deals", label: "All Deals", icon: <ListIcon /> },
  ];

  const mobileItems = [
    { href: "/admin/overview", label: "Overview", icon: <GridIcon width={18} height={18} /> },
    { href: "/admin/shield", label: "Shield", icon: <ShieldIcon width={18} height={18} /> },
    { href: "/admin/disputes", label: "Disputes", icon: <DisputeIcon width={18} height={18} /> },
    { href: "/admin/deals", label: "Deals", icon: <ListIcon width={18} height={18} /> },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <DashboardTopNav
        userId={session.id}
        dealHrefPrefix="/admin/deals"
        badge={
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold tracking-wide text-accent">
            ADMIN
          </span>
        }
      />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar
          avatarInitials="ZK"
          name="Zeke Admin"
          sub="Full access"
          navItems={navItems}
        />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-[900px] p-4 md:p-6">{children}</div>
        </main>
      </div>
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}
