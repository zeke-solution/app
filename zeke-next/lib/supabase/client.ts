import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Keep one browser client for the lifetime of the tab. Recreating it in each
// interactive component can duplicate auth listeners and Realtime sockets.
let browserClient: SupabaseClient | undefined;

// Browser client. Use ONLY for realtime subscriptions and harmless own-row
// reads (e.g. notifications bell). Every privileged write and every
// cross-user read goes through a Server Action / Server Component instead.
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
