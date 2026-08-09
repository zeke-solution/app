-- Migration plan deviation #3 (see ../../../.claude/plans/jolly-sparking-popcorn.md).
-- Lets notification rows deep-link to the deal they're about, since
-- notifications.body today is plain text with no link target
-- (e.g. js/creator.js's loadNotifications()/_loadBrandReview()'s
-- notification inserts have nowhere to point). Nullable + additive only -
-- safe to run against the live project at any time, no backfill needed.

alter table public.notifications
  add column if not exists related_deal_id uuid references public.deals(id);
