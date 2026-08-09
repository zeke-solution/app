"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Port of index.html's #top-nav + .nav-dropdown (hamburger menu on mobile).
export function TopNav() {
  const [open, setOpen] = useState(false);

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
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="relative z-[72] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl leading-none text-light sm:hidden"
          >
            {open ? <span aria-hidden>&times;</span> : <span aria-hidden>&#9776;</span>}
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-[60] bg-black/55 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="brand-nav fixed inset-x-3 top-[72px] z-[70] flex max-h-[calc(100dvh-84px)] flex-col gap-1 overflow-y-auto rounded-2xl border border-border bg-navy px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.55)] sm:hidden">
          <Link
            href="/#creators"
            onClick={() => setOpen(false)}
            className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white"
          >
            For Creators
          </Link>
          <Link
            href="/#brands"
            onClick={() => setOpen(false)}
            className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white"
          >
            For Brands
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">How It Works</Link>
          <Link href="/shield" onClick={() => setOpen(false)} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">Shield</Link>
          <Link href="/about" onClick={() => setOpen(false)} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">About</Link>
          <div className="my-1 border-t border-border" />
          <div className="flex gap-2 py-1">
            <Link
              href="/login"
              className={buttonClassName({ variant: "outline", size: "sm", fullWidth: true, className: "flex-1" })}
              onClick={() => setOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/register"
              className={buttonClassName({ size: "sm", fullWidth: true, className: "flex-1" })}
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
          </div>
        </>
      )}
    </nav>
  );
}
