import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { SHIELD_MONTHLY_PRICE_INR } from "@/lib/domain/constants";

type Status = "active" | "pending" | "none";

// Port of creator.js's requestShield()/_renderShieldUpsell()/_refreshShieldUpsellState().
export function ShieldUpsellCard({ initialStatus }: { initialStatus: Status }) {
  if (initialStatus === "active") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/[0.08] p-3.5">
        <div>
          <div className="text-[13px] font-bold text-gold">&#128737; Zeke Shield</div>
          <div className="mt-0.5 text-xs text-muted">Shield is active. Open your support dashboard to manage cases and learn exactly what is covered.</div>
        </div>
        <Link
          href="/creator/shield"
          className={buttonClassName({ variant: "gold", size: "sm" })}
        >
          Open Shield
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5">
      <div>
        <div className="text-[13px] font-bold text-gold">&#128737; Zeke Shield</div>
        <div className="mt-0.5 text-xs text-muted">
          {initialStatus === "pending"
            ? "Shield request submitted. Awaiting activation."
            : "Assisted follow-ups, creator-controlled legal access, gold badge and priority discovery"}
        </div>
      </div>
      {initialStatus === "pending" ? (
        <span className={buttonClassName({ variant: "gold", size: "sm", className: "cursor-default opacity-70" })}>
          Pending
        </span>
      ) : (
        <Link
          href="/creator/shield/payment"
          className={buttonClassName({ variant: "gold", size: "sm" })}
        >
          ₹{SHIELD_MONTHLY_PRICE_INR}/month
        </Link>
      )}
    </div>
  );
}
