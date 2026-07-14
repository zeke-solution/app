"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Port of index.html's #top-nav + .nav-dropdown (hamburger menu on mobile).
export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
        <Link href="/" className="text-[22px] font-black tracking-tight text-white">
          zeke<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/about"
              className="rounded-[10px] px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              About
            </Link>
            <a
              href="mailto:hello@zeke.global"
              className="rounded-[10px] px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Write to Us
            </a>
          </div>
          <div className="hidden items-center gap-2.5 md:flex">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 text-2xl leading-none text-light md:hidden"
          >
            &#9776;
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-b border-border bg-navy px-4 py-3 md:hidden">
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white"
          >
            About
          </Link>
          <a
            href="mailto:hello@zeke.global"
            onClick={() => setOpen(false)}
            className="block rounded-[10px] px-4 py-3 text-[15px] font-medium text-light hover:bg-white/5 hover:text-white"
          >
            Write to Us
          </a>
          <div className="my-1 border-t border-border" />
          <div className="flex gap-2 py-1">
            <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" fullWidth>
                Log In
              </Button>
            </Link>
            <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="primary" size="sm" fullWidth>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
