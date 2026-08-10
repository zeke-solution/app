"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BellIcon } from "@/components/layout/icons";

const NotificationsPanel = dynamic(
  () => import("@/components/layout/NotificationsPanel").then((module) => module.NotificationsPanel),
  { ssr: false, loading: NotificationBellPlaceholder },
);

export function DeferredNotificationsPanel({
  userId,
  dealHrefPrefix,
}: {
  userId: string;
  dealHrefPrefix: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => setReady(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(timerId);
  }, []);

  return ready ? (
    <NotificationsPanel userId={userId} dealHrefPrefix={dealHrefPrefix} />
  ) : (
    <NotificationBellPlaceholder />
  );
}

function NotificationBellPlaceholder() {
  return (
    <span
      role="status"
      aria-label="Notifications loading"
      className="inline-flex p-0.5 text-muted"
    >
      <BellIcon />
    </span>
  );
}
