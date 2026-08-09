import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Per-request, RLS-scoped Supabase client for Server Components/Actions/Route
// Handlers. Must be created fresh every call (it's bound to that request's
// cookies) - never hoist to a module-level singleton.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component (no response to write to).
            // Safe to ignore as long as the proxy refreshes the session cookie.
          }
        },
      },
    }
  );
}
