import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy px-6 pb-6 pt-12">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-10 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="mb-2 text-xl font-black text-white">
              zeke<span className="text-accent">.</span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-muted">
              Kerala&apos;s first legally-protected influencer marketplace.
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
              <Link href="/register" className="text-[13px] text-muted hover:text-white">
                For Brands
              </Link>
              <Link href="/register" className="text-[13px] text-muted hover:text-white">
                For Creators
              </Link>
              <Link href="/#shield" className="text-[13px] text-muted hover:text-white">
                Zeke Shield
              </Link>
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
              <Link href="/privacy" className="text-[13px] text-muted hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5">
          <div className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Zeke. All rights reserved.
          </div>
          <div className="text-xs text-light">&#128737; Legally protected deals</div>
        </div>
      </div>
    </footer>
  );
}
