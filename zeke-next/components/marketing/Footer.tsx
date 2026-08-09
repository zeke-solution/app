import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
    <footer className="brand-nav border-t border-transparent px-6 pb-6 pt-12">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-10 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <BrandLogo className="mb-3 w-[96px]" />
            <p className="mb-4 text-[13px] leading-relaxed text-muted">
              Kerala&apos;s structured creator-brand deal platform.
            </p>
            <a
              href="tel:+971523542485"
              className="mb-4 block w-fit text-[13px] font-semibold text-light transition-colors hover:text-white"
            >
              +971 52 354 2485
            </a>
            <div className="flex gap-3">
              <a
                href="mailto:hello@zeke.global"
                className="text-lg text-muted transition-colors hover:text-white"
                aria-label="Email Zeke"
              >
                &#9993;
              </a>
              <a
                href="https://instagram.com/zeke.global"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-muted transition-colors hover:text-white"
                aria-label="Zeke on Instagram"
              >
                &#128247;
              </a>
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-light">
              Platform
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/#brands" className="text-[13px] text-muted hover:text-white">
                For Brands
              </Link>
              <Link href="/#creators" className="text-[13px] text-muted hover:text-white">
                For Creators
              </Link>
              <Link href="/shield" className="text-[13px] text-muted hover:text-white">
                Zeke Shield
              </Link>
              <Link href="/#how-it-works" className="text-[13px] text-muted hover:text-white">How It Works</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-light">
              Company
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="text-[13px] text-muted hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="text-[13px] text-muted hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[13px] text-muted hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5">
          <div className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Zeke. All rights reserved.
          </div>
          <div className="text-xs text-light">&#128737; Clear deals. Creator-controlled support.</div>
        </div>
      </div>
    </footer>
  );
}
