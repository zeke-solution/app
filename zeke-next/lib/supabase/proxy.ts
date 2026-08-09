import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Called from the root proxy.ts (Next.js 16 renamed `middleware` -> `proxy`).
// Only checks "is there a valid session" - never queries Postgres for role
// here (that happens per-dashboard in lib/auth/roles.ts). Also responsible
// for refreshing the auth cookie on every request, since @supabase/ssr does
// not auto-refresh server-side the way the browser SDK does.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Revalidates the JWT against Supabase Auth (cheap, no Postgres hit) and
  // refreshes the session cookie if needed. Do not remove - required for
  // server-side session refresh per @supabase/ssr's documented pattern.
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
