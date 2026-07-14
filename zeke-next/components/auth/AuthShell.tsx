import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 blur-[40px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-7 text-center">
          <Link href="/" className="text-[28px] font-black text-white">
            zeke<span className="text-accent">.</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
