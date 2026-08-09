-- Structured campaign briefs keep creator-fit and commercial terms attached to
-- a published campaign, then carry the applicable terms into every offer.

alter table public.campaigns
  add column if not exists platform text,
  add column if not exists objective text,
  add column if not exists deliverables text,
  add column if not exists creator_requirements text,
  add column if not exists usage_rights text,
  add column if not exists exclusivity boolean not null default false,
  add column if not exists payment_terms text;
