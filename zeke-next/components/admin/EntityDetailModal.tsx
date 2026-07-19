"use client";

import { useEffect, useState } from "react";
import { getBrandDetail, getCreatorDetail, getDealDetail, type BrandDetail, type CreatorDetail, type AdminDealDetail } from "@/actions/admin";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";

type Target = { type: "brand"; id: string } | { type: "creator"; id: string } | { type: "deal"; id: string };

// Shared read-only deep-dive modal for admin's users/shield/disputes/deals
// list pages — port of admin.js's openAdminBrandProfile()/
// openAdminCreatorProfile()/openAdminDealDetail().
export function EntityDetailModal({ target, onClose }: { target: Target; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [deal, setDeal] = useState<AdminDealDetail | null>(null);

  useEffect(() => {
    // Modal is always a fresh mount per open (parent conditionally renders
    // it, unmounting on close — see DealsTable/UsersDirectoryTable/
    // ShieldRequestCard/DisputeCard), so the initial `loading: true` state
    // above covers the reset; no need to set it again here.
    if (target.type === "brand") getBrandDetail(target.id).then((d) => { setBrand(d); setLoading(false); });
    if (target.type === "creator") getCreatorDetail(target.id).then((d) => { setCreator(d); setLoading(false); });
    if (target.type === "deal") getDealDetail(target.id).then((d) => { setDeal(d); setLoading(false); });
  }, [target]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <div className="p-8 text-center text-sm text-muted">Loading...</div>}
        {!loading && target.type === "brand" && brand && <BrandPanel brand={brand} onClose={onClose} />}
        {!loading && target.type === "creator" && creator && <CreatorPanel creator={creator} onClose={onClose} />}
        {!loading && target.type === "deal" && deal && <DealPanel deal={deal} onClose={onClose} />}
        {!loading && !brand && !creator && !deal && <div className="p-8 text-center text-sm text-muted">Not found.</div>}
      </div>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-dark p-2.5 text-center">
      <div className="text-sm font-black" style={{ color: color ?? "#fff" }}>{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}

function BrandPanel({ brand, onClose }: { brand: BrandDetail; onClose: () => void }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple/15 text-base font-black text-purple">
          {brand.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black text-white">{brand.name}</div>
          <div className="text-xs text-muted">
            {brand.type.replace(/^./, (c) => c.toUpperCase())} {brand.location ? `· ${brand.location}` : ""} · Joined {fmtDate(brand.joined)}
          </div>
        </div>
        <button onClick={onClose} className="text-2xl leading-none text-muted">&times;</button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Tile label="Campaigns" value={brand.campaigns.length} />
        <Tile label="Deals" value={brand.deals.length} />
        <Tile label="Spent" value={`₹${fmtNum(brand.spent)}`} color="#059669" />
      </div>
      <div className="mb-2 text-xs font-bold text-light">Campaigns</div>
      {brand.campaigns.length === 0 ? (
        <div className="mb-3 text-xs text-muted">No campaigns yet.</div>
      ) : (
        brand.campaigns.map((c) => (
          <div key={c.id} className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border border-border bg-dark px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">{c.title}</div>
              <div className="text-[11px] text-muted">{c.niche} {c.deadline ? `· Due ${c.deadline}` : ""}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gold">₹{fmtNum(c.budget)}</div>
              <Badge variant={c.status === "active" ? "green" : "muted"}>{c.status}</Badge>
            </div>
          </div>
        ))
      )}
      <div className="mb-2 mt-3.5 text-xs font-bold text-light">Deals</div>
      {brand.deals.length === 0 ? (
        <div className="text-xs text-muted">No deals yet.</div>
      ) : (
        brand.deals.map((d) => (
          <div key={d.id} className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border border-border bg-dark px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">{d.title}</div>
              <div className="text-[11px] text-muted">with {d.creatorName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white">₹{fmtNum(d.amount)}</div>
              <Badge variant="muted">{d.status}</Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CreatorPanel({ creator, onClose }: { creator: CreatorDetail; onClose: () => void }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-base font-black text-accent">
          {creator.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black text-white">
            {creator.name} {creator.shieldActive && <span className="text-sm text-gold">🛡</span>}
          </div>
          <div className="text-xs text-muted">
            {creator.niche} {creator.handle ? `· @${creator.handle}` : ""} {creator.location ? `· ${creator.location}` : ""}
          </div>
          <div className="text-[11px] text-muted">Joined {fmtDate(creator.joined)}</div>
        </div>
        <button onClick={onClose} className="text-2xl leading-none text-muted">&times;</button>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Tile label="Instagram" value={fmtNum(creator.igFollowers)} color="#6366F1" />
        <Tile label="YouTube" value={creator.ytEnabled ? fmtNum(creator.ytFollowers) : "—"} color="#f87171" />
        <Tile label="Twitter/X" value={creator.xEnabled ? fmtNum(creator.xFollowers) : "—"} color="#38bdf8" />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Tile label="Deals" value={creator.deals.length} />
        <Tile label="Earned" value={`₹${fmtNum(creator.earned)}`} color="#059669" />
        <Tile label="Rating" value={`★ ${creator.rating ?? "—"}`} color="#D97706" />
      </div>
      <div className="mb-2 text-xs font-bold text-light">Deals</div>
      {creator.deals.length === 0 ? (
        <div className="text-xs text-muted">No deals yet.</div>
      ) : (
        creator.deals.map((d) => (
          <div key={d.id} className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border border-border bg-dark px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">{d.title}</div>
              <div className="text-[11px] text-muted">with {d.brandName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white">₹{fmtNum(d.amount)}</div>
              <Badge variant="muted">{d.status}</Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DealPanel({ deal, onClose }: { deal: AdminDealDetail; onClose: () => void }) {
  return (
    <div>
      <div className="mb-3.5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-black text-white">{deal.brandName} × {deal.creatorName}</div>
          <div className="text-[13px] text-muted">{deal.title} {deal.platform ? `· ${deal.platform}` : ""}</div>
        </div>
        <button onClick={onClose} className="text-2xl leading-none text-muted">&times;</button>
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-2">
        <Tile label="Value" value={`₹${fmtNum(deal.amount)}`} color="#D97706" />
        <Tile label="Status" value={deal.status} />
        <Tile label="Deadline" value={deal.deadline ?? "—"} />
      </div>
      {deal.deliverables && (
        <div className="mb-3.5 rounded-[10px] border border-border bg-dark px-3 py-2.5">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Deliverables</div>
          <div className="text-[13px] leading-relaxed text-light">{deal.deliverables}</div>
        </div>
      )}
      <div className="mb-2 text-xs font-bold text-light">Timeline</div>
      {deal.events.length === 0 ? (
        <div className="text-xs text-muted">No events yet.</div>
      ) : (
        deal.events.map((ev, i) => (
          <div key={i} className="flex items-start gap-2.5 py-1.5">
            <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ev.msg_type === "event_gold" ? "#D97706" : "#059669" }} />
            <div className="flex-1 text-xs leading-snug text-light">{ev.content}</div>
            <div className="flex-shrink-0 text-[11px] text-muted">{fmtDate(ev.created_at)}</div>
          </div>
        ))
      )}
    </div>
  );
}
