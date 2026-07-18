import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[700px] rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 to-[#0F3460]/30 px-8 py-14 text-center sm:px-10">
        <h2 className="mb-4 text-[28px] font-black leading-tight text-white sm:text-4xl">
          Kerala&apos;s creator economy - starts here.
        </h2>
        <p className="mx-auto mb-8 max-w-[480px] text-base leading-relaxed text-white/70">
          Whether you are a brand looking for genuine reach or a creator ready to deal with
          confidence - Zeke is built for you.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register?role=brand" className="w-full sm:w-auto">
            <Button
              size="lg"
              fullWidth
              className="border-white bg-white sm:w-auto"
              style={{ color: "#6366F1" }}
            >
              Join as a Brand
            </Button>
          </Link>
          <Link href="/register?role=influencer" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="border-white/30 text-white sm:w-auto"
            >
              Join as a Creator
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
