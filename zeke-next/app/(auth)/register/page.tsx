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
      <p className="mb-5 text-center text-sm leading-6 text-muted sm:mb-7">
        Create your free account
      </p>
      <RegisterForm initialRole={initialRole} />
      <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-muted sm:mt-5">
        &#128737; Kerala&apos;s structured creator-brand deal platform
      </div>
    </div>
  );
}
