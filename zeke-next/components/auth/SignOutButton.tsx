"use client";

import { signOutUser } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { SignOutIcon } from "@/components/layout/icons";

export function SignOutButton({
  fullWidth,
  iconOnly,
}: {
  fullWidth?: boolean;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <button
        onClick={() => signOutUser()}
        aria-label="Sign out"
        title="Sign out"
        className="p-0.5 text-accent"
      >
        <SignOutIcon width={18} height={18} />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOutUser()}
      fullWidth={fullWidth}
      className="justify-start gap-2.5 !text-accent"
    >
      <SignOutIcon />
      Sign Out
    </Button>
  );
}
