"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/domain/format";
import { BellIcon } from "@/components/layout/icons";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  read: boolean | null;
  related_deal_id: string | null;
  created_at: string | null;
}

// Port of shared.js's toggleNotif()/clearNotifs() + the per-dashboard
// loadNotifications()/subscribeToNotifications() pair. Self-contained: reads
// are own-row only (RLS-scoped to user_id = auth.uid()), so this stays
// client-side per the plan's "harmless own-row reads" rule.
export function NotificationsPanel({
  userId,
  dealHrefPrefix,
}: {
  userId: string;
  dealHrefPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    function load() {
      supabase
        .from("notifications")
        .select("id,title,body,read,related_deal_id,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => setNotifs(data ?? []));
    }
    load();

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  async function markAllRead() {
    const supabase = createClient();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative p-0.5 text-muted"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4.5 py-4">
              <div className="text-sm font-bold text-white">Notifications</div>
              <button onClick={markAllRead} className="text-xs font-semibold text-accent">
                Mark all read
              </button>
            </div>
            {notifs.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-muted">No notifications.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      if (n.related_deal_id) router.push(`${dealHrefPrefix}/${n.related_deal_id}`);
                    }}
                    className={`flex w-full items-start gap-3 border-b border-border/50 px-4.5 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
                      !n.read ? "bg-accent/[0.03]" : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-[13px] font-semibold text-white">{n.title}</div>
                      <div className="text-xs leading-snug text-muted">{n.body}</div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <div className="text-[11px] text-muted">{fmtDate(n.created_at)}</div>
                      {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
