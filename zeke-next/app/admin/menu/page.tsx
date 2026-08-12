import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

const GROUPS = [
  {
    title: "Platform operations",
    items: [
      ["Users", "All creator and brand profiles", "/admin/users"],
      ["Campaigns", "Campaign briefs and recipient workflows", "/admin/campaigns"],
      ["Deals", "Every creator-brand deal", "/admin/deals"],
      ["Platform records", "Messages, notifications, content, agreements, and payments", "/admin/records"],
    ],
  },
  {
    title: "Trust and protection",
    items: [
      ["Shield requests", "Membership payment and activation queue", "/admin/shield"],
      ["Shield cases", "Protected dispute coordination", "/admin/shield/cases"],
      ["Disputes", "All standard and Shield disputes", "/admin/disputes"],
      ["Legal provider pool", "Independent provider directory", "/admin/legal-pool"],
    ],
  },
  {
    title: "Governance",
    items: [
      ["System", "Auth accounts, data integrity, and Storage", "/admin/system"],
      ["Removal log", "Retryable jobs and permanent audit trail", "/admin/removals"],
      ["Admin account", "Current session controls", "/admin/account"],
    ],
  },
] as const;

export default function AdminMenuPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="All admin tools"
        description="Every operational, trust, and governance destination in one mobile-friendly directory."
      />
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <section key={group.title} className="min-w-0">
            <h2 className="mb-3 text-sm font-bold text-light">{group.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map(([label, description, href]) => (
                <Link key={href} href={href} className="min-w-0 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgba(43,36,56,0.06),0_6px_18px_rgba(43,36,56,0.035)]">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-light">{label}</h3>
                    <span className="text-lg text-accent" aria-hidden>›</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
