"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeAdminEntity, type AdminRemovalKind } from "@/actions/admin-removal";

export function AdminRemoveButton({
  kind,
  entityId,
  entityLabel,
  triggerLabel = "Remove",
  description,
  onRemoved,
  className = "",
}: {
  kind: AdminRemovalKind;
  entityId: string;
  entityLabel: string;
  triggerLabel?: string;
  description: string;
  onRemoved?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  }

  async function remove() {
    setPending(true);
    setError("");
    const result = await removeAdminEntity({ kind, entityId, confirmation });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.status === "needs_review") {
      window.alert(result.message);
    }
    setOpen(false);
    setConfirmation("");
    onRemoved?.();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-1.5 text-[11px] font-bold text-danger transition-colors hover:bg-danger/10 ${className}`}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex h-[100dvh] items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`remove-title-${entityId}`}
            className="w-full rounded-t-3xl border border-danger/25 bg-card p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl sm:max-w-md sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-danger">
                !
              </div>
              <div className="min-w-0">
                <h2 id={`remove-title-${entityId}`} className="text-base font-semibold text-light">
                  Permanently remove {entityLabel}?
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-danger/20 bg-danger/[0.05] p-3 text-xs leading-5 text-light">
              Dependent records and stored files are removed where applicable. This cannot be undone. A deletion audit entry remains.
            </div>

            <label className="mt-4 block">
              <span className="text-[11px] font-semibold text-muted">
                Type <span className="font-semibold text-danger">REMOVE</span> to confirm
              </span>
              <input
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-dark px-3 py-2.5 text-sm font-semibold text-light outline-none focus:border-danger/60"
              />
            </label>

            {error && (
              <div className="mt-3 rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-light disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending || confirmation !== "REMOVE"}
                className="rounded-xl border border-danger bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Removing..." : "Remove forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
