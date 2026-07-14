import { createBrowserClient } from "@supabase/ssr";

// Browser client. Use ONLY for realtime subscriptions and harmless own-row
// reads (e.g. notifications bell). Every privileged write and every
// cross-user read goes through a Server Action / Server Component instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
