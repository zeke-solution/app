import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <section className="bg-[#f5f4fc] px-5 pb-16 sm:px-6 sm:pb-20">
      <div className="brand-cta mx-auto grid max-w-[1120px] items-center gap-7 rounded-3xl border px-7 py-9 text-center sm:px-10 lg:grid-cols-[1fr_auto] lg:text-left">
        <div>
          <h2 className="text-[28px] font-black leading-tight text-white sm:text-4xl">
            Create with confidence. <span className="brand-gradient-text">Close with clarity.</span>
          </h2>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-white/70 sm:text-base">
            Zeke gives creators and brands a better way to meet, agree, deliver, and get the deal done.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register?role=brand"
            className={buttonClassName({ size: "lg", fullWidth: true, className: "sm:w-auto" })}
          >
            Join as a Brand
          </Link>
          <Link
            href="/register?role=influencer"
            className={buttonClassName({
              variant: "outline",
              size: "lg",
              fullWidth: true,
              className: "border-white/30 text-white sm:w-auto",
            })}
          >
            Join as a Creator
          </Link>
        </div>
      </div>
    </section>
  );
}
