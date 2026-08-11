import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "auth_callback_failed"
      ? "This sign-in or recovery link is invalid or has expired. Please request a new one."
      : params.error === "recovery_link_invalid"
        ? "This recovery link is invalid, expired, or already used. Request one fresh email and open only its newest link."
      : params.error === "account_not_setup"
        ? "Your account profile could not be loaded. Please contact support."
        : params.error === "google_identity_required"
          ? "Please sign in with Google again to finish account setup."
      : "";

  return (
    <div>
      <p className="mb-5 text-center text-sm leading-6 text-muted sm:mb-7">
        Sign in to your account
      </p>
      <LoginForm initialError={initialError} />
      <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-muted sm:mt-5">
        &#128737; Structured deals and creator-controlled support
      </div>
    </div>
  );
}
