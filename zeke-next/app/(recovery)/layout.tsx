import { AuthShell } from "@/components/auth/AuthShell";

// Password-recovery links create an authenticated Supabase session before
// rendering /update-password. Keep this route outside the normal auth layout,
// which intentionally redirects authenticated users to their dashboard.
export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
