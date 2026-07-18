import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div>
      <p className="mb-7 text-center text-[13px] text-muted">Verify your email</p>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-7 text-center shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_4px_24px_rgba(99,102,241,0.08)]">
        <div className="text-4xl">&#9993;</div>
        <div className="text-base font-bold text-white">Check your inbox</div>
        <div className="text-[13px] leading-relaxed text-muted">
          {email
            ? `We sent a verification link to ${email}.`
            : "We sent a verification link to your email."}
        </div>
        <div className="text-xs leading-relaxed text-muted">
          Click the link in the email to activate your account. The link will redirect you back
          here automatically.
        </div>
        <Link href="/login" className="w-full">
          <Button variant="outline" fullWidth>
            Back to Sign In
          </Button>
        </Link>
      </div>
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        &#128231; Can&apos;t find the email? Check spam or junk.
      </div>
    </div>
  );
}
