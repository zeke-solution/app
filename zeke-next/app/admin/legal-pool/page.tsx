import { createClient } from "@/lib/supabase/server";
import type { LegalProviderRow } from "@/lib/domain/shield-case";
import { LegalProviderManager } from "@/components/admin/LegalProviderManager";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminLegalPoolPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("legal_providers").select("*").order("active", { ascending: false }).order("display_name");

  return (
    <div>
      <PageHeader
        eyebrow="Shield operations"
        title="Independent legal-provider pool"
        description="Maintain factual provider records. Creators choose, engage, and pay providers directly; Zeke receives no referral commission."
      />
      <LegalProviderManager providers={(data ?? []) as LegalProviderRow[]} />
    </div>
  );
}
