"use server";

import { createClient } from "@/lib/supabase/server";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import { getSessionForRole } from "@/lib/auth/roles";

async function requireAdminClient() {
  const session = await getSessionForRole("admin");
  return session ? createClient() : null;
}

export interface BrandDirectoryRow {
  id: string;
  type: string;
  name: string;
  location: string;
  joined: string | null;
  dealsTotal: number;
  dealsCompleted: number;
  spent: number;
}

// Port of admin.js's loadBrandsDirectory(). Today's app does one query per
// brand (N+1) to get deal stats - rewritten here as: one query for all
// brands, one query for all their deals, aggregated in JS. Still not a true
// SQL aggregate (group by), but removes the N+1 round trips, which is the
// practical win; RLS under the admin user already grants full visibility so
// no service-role client is needed (see plan section 3.2).
export async function getBrandsDirectory(): Promise<BrandDirectoryRow[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data: brands } = await supabase
    .from("brand_profiles")
    .select("id,brand_type,profiles!brand_profiles_id_fkey(display_name,location,created_at)");
  if (!brands?.length) return [];

  const ids = brands.map((b) => b.id);
  const { data: deals } = await supabase.from("deals").select("brand_id,amount,status").in("brand_id", ids);

  return brands.map((b) => {
    const p = b.profiles as unknown as { display_name?: string; location?: string; created_at?: string } | null;
    const myDeals = (deals ?? []).filter((d) => d.brand_id === b.id);
    const completed = myDeals.filter((d) => d.status === "completed");
    return {
      id: b.id,
      type: b.brand_type ?? "business",
      name: p?.display_name ?? "Brand",
      location: p?.location ?? "",
      joined: p?.created_at ?? null,
      dealsTotal: myDeals.length,
      dealsCompleted: completed.length,
      spent: completed.reduce((s, d) => s + (d.amount ?? 0), 0),
    };
  });
}

export interface CreatorDirectoryRow {
  id: string;
  name: string;
  location: string;
  niche: string | null;
  handle: string | null;
  igFollowers: number;
  shieldActive: boolean;
  joined: string | null;
  dealsCompleted: number;
  earned: number;
}

// Port of admin.js's loadCreatorsDirectory() - same N+1-removal treatment.
export async function getCreatorsDirectory(): Promise<CreatorDirectoryRow[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data: creators } = await supabase
    .from("influencer_profiles")
    .select("id,niche,handle,ig_followers,shield_active,shield_expires,profiles!influencer_profiles_id_fkey(display_name,location,created_at)")
    .order("shield_active", { ascending: false })
    .order("ig_followers", { ascending: false });
  if (!creators?.length) return [];

  const ids = creators.map((c) => c.id);
  const { data: deals } = await supabase.from("deals").select("influencer_id,amount,status").in("influencer_id", ids);

  return creators.map((c) => {
    const p = c.profiles as unknown as { display_name?: string; location?: string; created_at?: string } | null;
    const myDeals = (deals ?? []).filter((d) => d.influencer_id === c.id);
    const completed = myDeals.filter((d) => d.status === "completed");
    return {
      id: c.id,
      name: p?.display_name ?? "Creator",
      location: p?.location ?? "",
      niche: c.niche,
      handle: c.handle,
      igFollowers: c.ig_followers ?? 0,
      shieldActive: isShieldMembershipActive(c),
      joined: p?.created_at ?? null,
      dealsCompleted: completed.length,
      earned: completed.reduce((s, d) => s + (d.amount ?? 0), 0),
    };
  });
}

export interface BrandDetail {
  name: string;
  type: string;
  location: string;
  joined: string | null;
  campaigns: { id: string; title: string; niche: string | null; budget: number | null; deadline: string | null; status: string | null }[];
  deals: { id: string; title: string | null; amount: number | null; status: string; creatorName: string }[];
  spent: number;
}

export async function getBrandDetail(brandId: string): Promise<BrandDetail | null> {
  const supabase = await requireAdminClient();
  if (!supabase) return null;

  const [{ data: brand }, { data: campaigns }, { data: deals }] = await Promise.all([
    supabase.from("brand_profiles").select("*, profiles!brand_profiles_id_fkey(display_name,location,created_at)").eq("id", brandId).single(),
    supabase.from("campaigns").select("id,title,niche,budget,deadline,status").eq("brand_id", brandId).order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select("id,title,amount,status,creator:profiles!deals_influencer_id_fkey(display_name)")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false }),
  ]);
  if (!brand) return null;

  const p = brand.profiles as unknown as { display_name?: string; location?: string; created_at?: string } | null;
  const dealRows = (deals ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    amount: d.amount,
    status: d.status,
    creatorName: (d.creator as unknown as { display_name?: string } | null)?.display_name ?? "Creator",
  }));

  return {
    name: p?.display_name ?? "Brand",
    type: brand.brand_type ?? "business",
    location: p?.location ?? "",
    joined: p?.created_at ?? null,
    campaigns: campaigns ?? [],
    deals: dealRows,
    spent: dealRows.filter((d) => d.status === "completed").reduce((s, d) => s + (d.amount ?? 0), 0),
  };
}

export interface CreatorDetail {
  name: string;
  niche: string | null;
  handle: string | null;
  location: string;
  joined: string | null;
  igFollowers: number;
  ytFollowers: number | null;
  ytEnabled: boolean;
  xFollowers: number | null;
  xEnabled: boolean;
  rating: number | null;
  shieldActive: boolean;
  deals: { id: string; title: string | null; amount: number | null; status: string; brandName: string }[];
  earned: number;
}

export async function getCreatorDetail(creatorId: string): Promise<CreatorDetail | null> {
  const supabase = await requireAdminClient();
  if (!supabase) return null;

  const [{ data: inf }, { data: deals }] = await Promise.all([
    supabase
      .from("influencer_profiles")
      .select("*, profiles!influencer_profiles_id_fkey(display_name,location,created_at)")
      .eq("id", creatorId)
      .single(),
    supabase
      .from("deals")
      .select("id,title,amount,status,brand:profiles!deals_brand_id_fkey(display_name)")
      .eq("influencer_id", creatorId)
      .order("updated_at", { ascending: false }),
  ]);
  if (!inf) return null;

  const p = inf.profiles as unknown as { display_name?: string; location?: string; created_at?: string } | null;
  const dealRows = (deals ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    amount: d.amount,
    status: d.status,
    brandName: (d.brand as unknown as { display_name?: string } | null)?.display_name ?? "Brand",
  }));

  return {
    name: p?.display_name ?? "Creator",
    niche: inf.niche,
    handle: inf.handle,
    location: p?.location ?? "",
    joined: p?.created_at ?? null,
    igFollowers: inf.ig_followers ?? 0,
    ytFollowers: inf.yt_followers,
    ytEnabled: !!inf.yt_enabled,
    xFollowers: inf.x_followers,
    xEnabled: !!inf.x_enabled,
    rating: inf.rating,
    shieldActive: isShieldMembershipActive(inf),
    deals: dealRows,
    earned: dealRows.filter((d) => d.status === "completed").reduce((s, d) => s + (d.amount ?? 0), 0),
  };
}

export interface AdminDealDetail {
  brandName: string;
  creatorName: string;
  title: string | null;
  platform: string | null;
  amount: number | null;
  status: string;
  deadline: string | null;
  deliverables: string | null;
  events: { msg_type: string | null; content: string; created_at: string | null }[];
}

export async function getDealDetail(dealId: string): Promise<AdminDealDetail | null> {
  const supabase = await requireAdminClient();
  if (!supabase) return null;

  const [{ data: deal }, { data: events }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, brand:profiles!deals_brand_id_fkey(display_name), creator:profiles!deals_influencer_id_fkey(display_name)")
      .eq("id", dealId)
      .single(),
    supabase
      .from("deal_messages")
      .select("msg_type,content,created_at")
      .eq("deal_id", dealId)
      .in("msg_type", ["event", "event_gold"])
      .order("created_at", { ascending: true }),
  ]);
  if (!deal) return null;

  return {
    brandName: (deal.brand as unknown as { display_name?: string } | null)?.display_name ?? "Brand",
    creatorName: (deal.creator as unknown as { display_name?: string } | null)?.display_name ?? "Creator",
    title: deal.title,
    platform: deal.platform,
    amount: deal.amount,
    status: deal.status,
    deadline: deal.deadline,
    deliverables: deal.deliverables,
    events: events ?? [],
  };
}
