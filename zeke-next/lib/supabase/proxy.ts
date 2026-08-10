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

  // Verifies the JWT signature and expiry. Zeke uses an asymmetric ES256
  // signing key, so the SDK can validate against cached JWKS instead of
  // making an Auth-server request on every protected navigation.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
