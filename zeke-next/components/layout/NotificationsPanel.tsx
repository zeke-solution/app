"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const POPUP_DURATION_MS = 7000;

export function NotificationsPanel({
  userId,
  dealHrefPrefix,
}: {
  userId: string;
  dealHrefPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [popups, setPopups] = useState<NotificationRow[]>([]);
  const popupTimers = useRef(new Map<string, number>());
  const router = useRouter();
  const supabase = createClient();

  const dismissPopup = useCallback((notificationId: string) => {
    const timer = popupTimers.current.get(notificationId);
    if (timer) window.clearTimeout(timer);
    popupTimers.current.delete(notificationId);
    setPopups((current) => current.filter((item) => item.id !== notificationId));
  }, []);

  useEffect(() => {
    let active = true;
    const timers = popupTimers.current;

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,read,related_deal_id,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (active) setNotifs(data ?? []);
    }
    void load();

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new as NotificationRow;
          setNotifs((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 10));
          setPopups((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 3));
          const timer = window.setTimeout(() => dismissPopup(notification.id), POPUP_DURATION_MS);
          timers.set(notification.id, timer);
        }
      )
      .subscribe();

    return () => {
      active = false;
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
      void supabase.removeChannel(channel);
    };
  }, [dismissPopup, supabase, userId]);

  const unreadCount = notifs.filter((notification) => !notification.read).length;

  async function markAllRead() {
    setNotifs((current) => current.map((notification) => ({ ...notification, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  function openNotification(notification: NotificationRow) {
    setOpen(false);
    dismissPopup(notification.id);
    setNotifs((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    );
    if (!notification.read) {
      void supabase.from("notifications").update({ read: true }).eq("id", notification.id);
    }
    if (notification.related_deal_id) {
      router.push(`${dealHrefPrefix}/${notification.related_deal_id}`);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          onClick={() => setOpen((current) => !current)}
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
                  {notifs.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      className={`flex w-full items-start gap-3 border-b border-border/50 px-4.5 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
                        !notification.read ? "bg-accent/[0.03]" : ""
                      }`}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <span className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 text-[13px] font-semibold text-white">{notification.title}</div>
                        {notification.body && <div className="text-xs leading-snug text-muted">{notification.body}</div>}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <div className="text-[11px] text-muted">{fmtDate(notification.created_at)}</div>
                        {!notification.read && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div
        className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {popups.map((notification) => (
          <div
            key={notification.id}
            role="status"
            className="pointer-events-auto flex overflow-hidden rounded-2xl border border-purple/40 bg-card/95 shadow-[0_18px_55px_rgba(13,11,22,0.5)] backdrop-blur-xl"
          >
            <button
              onClick={() => openNotification(notification)}
              className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left"
            >
              <span className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 to-purple/25 text-accent">
                <BellIcon width={17} height={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-white">{notification.title}</span>
                {notification.body && <span className="mt-1 block text-xs leading-5 text-muted">{notification.body}</span>}
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-cyan">
                  {notification.related_deal_id ? "Open deal" : "New notification"}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissPopup(notification.id)}
              className="px-3 text-lg text-muted transition-colors hover:text-white"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
