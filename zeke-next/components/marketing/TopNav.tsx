import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { MobileMenu } from "@/components/marketing/MobileMenu";

// Port of index.html's #top-nav + .nav-dropdown (hamburger menu on mobile).
export function TopNav() {
  return (
    <nav className="brand-nav sticky top-0 z-50 border-b border-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="Zeke home" className="inline-flex">
          <BrandLogo className="w-[82px]" preload />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-0.5 lg:flex">
            <Link
              href="/#creators"
              className="rounded-[10px] px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              For Creators
            </Link>
            <Link
              href="/#brands"
              className="rounded-[10px] px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              For Brands
            </Link>
            <Link href="/#how-it-works" className="rounded-[10px] px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white">How It Works</Link>
            <Link href="/shield" className="rounded-[10px] px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white">Shield</Link>
            <Link href="/about" className="rounded-[10px] px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white">About</Link>
          </div>
          <div className="hidden items-center gap-2.5 sm:flex">
            <Link href="/login" className={buttonClassName({ variant: "outline", size: "sm" })}>
              Log In
            </Link>
            <Link href="/register" className={buttonClassName({ size: "sm" })}>
              Get Started
            </Link>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
