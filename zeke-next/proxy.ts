import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()`.
// Only gates "is logged in" for the three dashboard trees; per-role checks
// happen in each dashboard's layout.tsx (see lib/auth/roles.ts) where the
// profile row already needs to be fetched anyway.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/creator/:path*", "/brand/:path*", "/admin/:path*"],
};
