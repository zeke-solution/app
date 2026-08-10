import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { roleHome } from "@/lib/auth/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,onboarding_completed,display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?error=account_not_setup");
  if (profile.onboarding_completed && profile.role !== "pending") {
    redirect(roleHome(profile.role));
  }

  const hasGoogleIdentity = user.identities?.some(
    (identity) => identity.provider === "google",
  );
  if (!hasGoogleIdentity) redirect("/login?error=google_identity_required");

  const { role } = await searchParams;
  const initialRole = role === "brand" ? "brand" : "influencer";
  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : profile.display_name;

  return (
    <AuthShell>
      <div>
        <p className="mb-1 text-center text-sm font-semibold text-light">
          Finish setting up Zeke
        </p>
        <p className="mb-5 text-center text-xs leading-5 text-muted sm:mb-7 sm:text-sm">
          Choose how you use Zeke and complete the required profile details.
        </p>
        <RegisterForm
          mode="google-onboarding"
          initialRole={initialRole}
          initialName={metadataName}
          initialEmail={user.email ?? ""}
        />
      </div>
    </AuthShell>
  );
}
