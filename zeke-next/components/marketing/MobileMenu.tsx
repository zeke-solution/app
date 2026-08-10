"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative z-[72] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl leading-none text-light sm:hidden"
      >
        {open ? <span aria-hidden>&times;</span> : <span aria-hidden>&#9776;</span>}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-[60] bg-black/55 sm:hidden"
            onClick={close}
          />
          <div className="brand-nav fixed inset-x-3 top-[72px] z-[70] flex max-h-[calc(100dvh-84px)] flex-col gap-1 overflow-y-auto rounded-2xl border border-border bg-navy px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.55)] sm:hidden">
            <Link href="/#creators" onClick={close} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">For Creators</Link>
            <Link href="/#brands" onClick={close} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">For Brands</Link>
            <Link href="/#how-it-works" onClick={close} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">How It Works</Link>
            <Link href="/shield" onClick={close} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">Shield</Link>
            <Link href="/about" onClick={close} className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white">About</Link>
            <div className="my-1 border-t border-border" />
            <div className="flex gap-2 py-1">
              <Link href="/login" className={buttonClassName({ variant: "outline", size: "sm", fullWidth: true, className: "flex-1" })} onClick={close}>Log In</Link>
              <Link href="/register" className={buttonClassName({ size: "sm", fullWidth: true, className: "flex-1" })} onClick={close}>Get Started</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
