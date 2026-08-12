import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/roles";
import { fmtDate } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";

const DATASETS = [
  "profiles",
  "influencer_profiles",
  "brand_profiles",
  "guardians",
  "campaigns",
  "deals",
  "deal_messages",
  "submissions",
  "final_links",
  "payments",
  "agreements",
  "disputes",
  "notifications",
  "shield_requests",
  "legal_providers",
  "shield_cases",
  "shield_case_updates",
  "shield_case_documents",
  "admin_removal_jobs",
  "admin_removal_audit",
] as const;

export default async function AdminSystemPage() {
  await requireRole("admin");
  const admin = createAdminClient();

  const [authUsers, profilesResult, counts, bucketsResult] = await Promise.all([
    listAllAuthUsers(admin),
    admin.from("profiles").select("id,role,display_name,onboarding_completed,created_at").order("created_at"),
    Promise.all(DATASETS.map(async (table) => {
      const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
      return { table, count: count ?? 0, error: error?.message ?? null };
    })),
    admin.storage.listBuckets(),
  ]);

  const profiles = profilesResult.data ?? [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const authIds = new Set(authUsers.map((user) => user.id));
  const authWithoutProfile = authUsers.filter((user) => !profileById.has(user.id));
  const profileWithoutAuth = profiles.filter((profile) => !authIds.has(profile.id));
  const unconfirmed = authUsers.filter((user) => !user.email_confirmed_at);

  const storageCounts = await Promise.all(
    (bucketsResult.data ?? []).map(async (bucket) => ({
      id: bucket.id,
      name: bucket.name,
      isPublic: bucket.public,
      count: await countStorageObjects(admin, bucket.name),
    })),
  );

  return (
    <div>
      <PageHeader
        eyebrow="System administration"
        title="Accounts and data inventory"
        description="Review authentication identities, profile integrity, table coverage, and Storage usage without exposing project secrets."
        actions={<Badge variant={authWithoutProfile.length || profileWithoutAuth.length ? "danger" : "green"}>{authWithoutProfile.length || profileWithoutAuth.length ? "Review integrity" : "Identity data aligned"}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SystemMetric label="Auth accounts" value={authUsers.length} />
        <SystemMetric label="Application profiles" value={profiles.length} />
        <SystemMetric label="Unconfirmed email" value={unconfirmed.length} />
        <SystemMetric label="Identity mismatches" value={authWithoutProfile.length + profileWithoutAuth.length} danger={authWithoutProfile.length + profileWithoutAuth.length > 0} />
      </div>

      <section className="mb-7 min-w-0">
        <SectionHeader title="Authentication accounts" description="Server-only Auth metadata; passwords and provider secrets are never available here." />
        <div className="space-y-2">
          {authUsers.map((user) => (
            <AuthAccountRow key={user.id} user={user} profile={profileById.get(user.id) ?? null} />
          ))}
          {authUsers.length === 0 && <Empty>No authentication accounts found.</Empty>}
        </div>
      </section>

      {(authWithoutProfile.length > 0 || profileWithoutAuth.length > 0) && (
        <section className="mb-7 min-w-0">
          <SectionHeader title="Identity integrity exceptions" description="These records require review before role or account changes." />
          <div className="grid gap-3 lg:grid-cols-2">
            <IntegrityList title="Auth account without profile" ids={authWithoutProfile.map((user) => user.id)} />
            <IntegrityList title="Profile without Auth account" ids={profileWithoutAuth.map((profile) => profile.id)} />
          </div>
        </section>
      )}

      <section className="mb-7 min-w-0">
        <SectionHeader title="Database inventory" description="Live row counts across every application dataset visible to Zeke operations." />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {counts.map((item) => (
            <div key={item.table} className="min-w-0 rounded-xl bg-card p-3">
              <div className="truncate text-xs font-semibold text-muted">{labelize(item.table)}</div>
              <div className={`mt-1 text-xl font-bold ${item.error ? "text-danger" : "text-light"}`}>{item.error ? "Error" : item.count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="min-w-0">
        <SectionHeader title="Storage inventory" description="Object totals by bucket. Private file access remains signed and time-limited." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {storageCounts.map((bucket) => (
            <div key={bucket.id} className="rounded-xl bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-light">{bucket.name}</div>
                  <div className="mt-1 text-xs text-muted">{bucket.isPublic ? "Public bucket" : "Private bucket"}</div>
                </div>
                <div className="text-2xl font-bold text-accent">{bucket.count}</div>
              </div>
            </div>
          ))}
          {storageCounts.length === 0 && <Empty>No Storage buckets found.</Empty>}
        </div>
      </section>
    </div>
  );
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function listAllAuthUsers(admin: AdminClient) {
  const users: User[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Authentication accounts could not be loaded.");
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function countStorageObjects(admin: AdminClient, bucket: string, prefix = "", depth = 0): Promise<number> {
  if (depth > 8) return 0;
  let total = 0;
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (error) return total;
    const entries = data ?? [];
    for (const entry of entries) {
      if (entry.id) total += 1;
      else total += await countStorageObjects(admin, bucket, prefix ? `${prefix}/${entry.name}` : entry.name, depth + 1);
    }
    if (entries.length < 100) break;
  }
  return total;
}

function AuthAccountRow({
  user,
  profile,
}: {
  user: User;
  profile: { role: string; display_name: string; onboarding_completed: boolean; created_at: string | null } | null;
}) {
  const providers = (user.app_metadata.providers as string[] | undefined) ?? [];
  const isBanned = Boolean(user.banned_until);
  return (
    <article className="min-w-0 rounded-xl bg-card p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-bold text-light">{profile?.display_name ?? user.email ?? "Auth account"}</h3>
            <Badge variant={isBanned ? "danger" : user.email_confirmed_at ? "green" : "gold"}>{isBanned ? "Banned" : user.email_confirmed_at ? "Confirmed" : "Unconfirmed"}</Badge>
            <Badge variant="muted">{profile?.role ?? "No profile"}</Badge>
          </div>
          <div className="mt-1 break-all text-sm text-accent">{user.email ?? "No email"}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>Created {fmtDate(user.created_at)}</span>
            <span>Last sign-in {user.last_sign_in_at ? fmtDate(user.last_sign_in_at) : "Never"}</span>
            <span>Providers {providers.length ? providers.join(", ") : "Unknown"}</span>
            <span>Onboarding {profile?.onboarding_completed === false ? "Pending" : "Complete"}</span>
          </div>
        </div>
        <div className="break-all text-[11px] text-muted sm:max-w-52 sm:text-right">{user.id}</div>
      </div>
    </article>
  );
}

function SystemMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-xl bg-card p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div><div className={`mt-2 text-2xl font-bold ${danger ? "text-danger" : "text-light"}`}>{value}</div></div>;
}

function IntegrityList({ title, ids }: { title: string; ids: string[] }) {
  return <div className="rounded-xl bg-danger/10 p-4"><div className="text-sm font-bold text-danger">{title}</div>{ids.map((id) => <div key={id} className="mt-2 break-all text-xs text-light">{id}</div>)}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-card p-8 text-center text-sm text-muted">{children}</div>;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
