import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { roleHome } from "@/lib/auth/navigation";

// Port of auth.js's boot-time getSession() -> role lookup -> redirect, done
// server-side now (no more "flash of login form before JS redirects").
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,onboarding_completed")
      .eq("id", data.user.id)
      .single();

    if (profile) redirect(roleHome(profile.onboarding_completed ? profile.role : "pending"));
  }

  return <AuthShell>{children}</AuthShell>;
}
