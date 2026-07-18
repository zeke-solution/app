// The atomic transition RPCs in supabase/migrations/0003_atomic_transitions.sql
// return null on success or a short error code. User-facing copy stays here in
// TypeScript rather than in SQL, so the wording lives in one place with the
// rest of the UI strings.

const SHARED_MESSAGES: Record<string, string> = {
  not_authenticated: "Not authenticated.",
  not_your_deal: "Not your deal.",
};

/**
 * Maps a transition code to display copy. `messages` holds the codes whose
 * wording depends on the caller (`wrong_status` reads differently for a
 * submission than for a payment); `fallback` covers codes a newer migration
 * might return before this map knows about them.
 */
export function transitionError(
  code: string,
  messages: Record<string, string>,
  fallback: string
): string {
  return messages[code] ?? SHARED_MESSAGES[code] ?? fallback;
}
