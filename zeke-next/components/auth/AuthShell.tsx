import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent/15 via-purple/10 to-pink/15 blur-[50px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-7 text-center">
          <Link href="/" aria-label="Zeke home" className="inline-flex">
            <BrandLogo className="w-[112px]" preload />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
