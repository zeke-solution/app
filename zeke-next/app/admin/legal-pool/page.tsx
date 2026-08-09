import { createClient } from "@/lib/supabase/server";
import type { LegalProviderRow } from "@/lib/domain/shield-case";
import { LegalProviderManager } from "@/components/admin/LegalProviderManager";

export default async function AdminLegalPoolPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("legal_providers").select("*").order("active", { ascending: false }).order("display_name");

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-purple">Shield operations</div>
        <h1 className="mt-1 text-xl font-black text-light">Independent legal-provider pool</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Maintain factual provider records. Creators make their own choice, engage and pay providers directly, and Zeke receives no referral commission.
        </p>
      </div>
      <LegalProviderManager providers={(data ?? []) as LegalProviderRow[]} />
    </div>
  );
}
