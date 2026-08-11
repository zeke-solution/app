import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-content relative flex min-h-[100dvh] items-center justify-center overflow-x-clip px-3.5 py-6 sm:px-4 sm:py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent/15 via-purple/10 to-pink/15 blur-[50px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-5 text-center sm:mb-7">
          <Link href="/" aria-label="Zeke home" className="inline-flex">
            <BrandLogo className="w-[112px]" preload />
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
