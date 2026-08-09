import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely - reserve for the rare case a
// read/write genuinely cannot be expressed under RLS efficiently, and
// document why at the call site. Never import this file from a Client
// Component or return its instance from a Server Action; the `server-only`
// import above makes any accidental client-bundle import a build error.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (see .env.local.example) before using the admin client."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
