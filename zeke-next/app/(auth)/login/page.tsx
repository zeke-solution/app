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
