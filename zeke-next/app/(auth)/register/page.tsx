import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole = role === "brand" ? "brand" : "influencer";

  return (
    <div>
      <p className="mb-7 text-center text-[13px] text-muted">Create your free account</p>
      <RegisterForm initialRole={initialRole} />
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        &#128737; Kerala&apos;s legally protected influencer marketplace
      </div>
    </div>
  );
}
