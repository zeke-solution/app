# Zeke project memory

Last updated: 2026-08-09

## Source of truth

- The active product is the Next.js app in `C:\Users\SEO EXECUTIVE\Desktop\app\zeke-next`.
- The Git repository root is `C:\Users\SEO EXECUTIVE\Desktop\app` and the remote is `https://github.com/zeke-solution/app`.
- `zeke-next/HANDOFF.md` is the canonical continuation note. The untracked `HANDOFF.md` at the repository root is stale and must not be staged.
- Production deploys from `main` to Vercel and uses Supabase project `fslthsbjtgmdbabwcubs`.
- Never put passwords, API keys, tokens, or full environment values in source control or handoff files.

## Product model

- Zeke is a structured creator-brand deal platform. It keeps discovery, offers, terms, content review, final links, payment status, disputes, and the deal record together.
- The core marketplace is free and Zeke does not take a percentage of creator earnings.
- Zeke Shield is an optional creator support membership priced at `₹1,999/month` for one month of access. It does not renew automatically unless that behavior is deliberately changed later.
- Shield includes assisted follow-ups, table talks, a structured case record, provider access, authorised coordination, verified status, and priority discovery.
- The creator controls whether and how long table talks continue and whether to seek legal help.
- Legal providers are independent. Creators choose, engage, and pay them directly. Lawyer, court, and filing costs are not included. Zeke receives no referral commission and is not a law firm or legal representative.

## Brand and writing system

- Use the official supplied logo assets: `/public/images/zeke-logo-white.png` for the full wordmark and `/public/images/zeke-logo-mark.png` for compact placements and the app icon.
- Use `components/ui/BrandLogo.tsx` for shared site branding. Do not recreate the logo with typed text, improvised SVGs, or generative edits.
- Approved visual language: mature dark indigo surfaces, restrained purple-to-pink emphasis, cyan only as a supporting accent, Sora headings, and Inter body text.
- Card artwork should use clean social-media or product-UI references without human figures unless the owner asks otherwise. Protect readability with strong contrast and restrained overlays.
- Keep homepage product visuals simple and credible. Avoid decorative graphs or unsupported aggregate statistics.
- Use short hyphens (`-`), not em dashes or other long dash characters, in new product copy.
- Preserve the owner-approved phrase and contrast treatment for `Create with confidence. Close with clarity.`

## Authentication and services

- Supabase email-password signup creates the auth identity, creates the role profile through the database trigger, and sends a confirmation link through the configured custom email path.
- Signup uses `https://zekesolution.com/auth/callback?next=/login`; password reset uses the same callback with `next=/update-password`.
- A controlled signup on 2026-08-08 succeeded for the Gmail alias `mufeedputhalath+zekeqa-20260809094042@gmail.com`; Supabase created a new identity and required email confirmation.
- The remaining manual auth check is clicking the real inbox confirmation link and completing a password-reset email callback. Do not describe those callbacks as verified until they have been clicked successfully.
- Required production variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`. `SUPABASE_SERVICE_ROLE_KEY` is intentionally absent while no active application code needs it.

## Deal safety, notifications, and dashboard performance

- A deal with an open or escalated dispute must not transition to `completed` or `cancelled`. Migration `0010_active_dispute_close_guard.sql` enforces this invariant in the database, including the edge case where a cancellation was requested before the dispute opened.
- Migration 0010 was applied to the linked production Supabase project on 2026-08-09. The application also blocks cancellation acceptance and decline while a deal is disputed, and both role views explain that the dispute must be resolved first.
- `NotificationsPanel` uses the signed-in user's filtered Supabase Realtime insert stream to show up to three in-app popup cards. Popups auto-dismiss after seven seconds, can be closed, mark the notification read when opened, and link to the related deal when one exists.
- Current popups work while Zeke is open and the user is signed in. Browser or operating-system push while Zeke is closed is a separate phase requiring notification permission, a service worker, stored push subscriptions, and a server-side delivery path.
- Dashboard responsiveness improvements include one shared browser Supabase client, direct Realtime payload updates without a second notification query, route loading skeletons for creator, brand, and admin areas, and Next.js `Link` navigation for the brand campaign action.
- Treat performance as measured work. These changes remove identified sources of perceived lag, but any remaining lag should be reproduced on the specific route and action before further optimisation.
## External representation

- `docs/EXTERNAL-MEETING-PROTOCOL.md` is the operating standard whenever an outsider is involved in a Zeke meeting, pitch, demo, negotiation, event, or informal business conversation.
- No representative may make an oral commitment on equity, investment, exclusivity, commission, pricing, legal outcomes, product delivery, data access, or settlement outside the written approval matrix.
- Use minimum-necessary disclosure, explicit recording or AI-transcription consent, documented conflicts, a named meeting owner, and a written follow-up record.
## Working conventions

- Read `AGENTS.md` and the relevant bundled Next.js 16 guide under `node_modules/next/dist/docs/` before changing framework behavior.
- Preserve unrelated work in a dirty tree. Stage only explicit intended paths, never the stale root handoff.
- Before publishing, run TypeScript, ESLint, a production build, targeted browser QA, and a remote/live verification appropriate to the change.
- Keep `devIndicators: false` in local config so the Next.js development badge and its viewport guide line do not obstruct visual review. Framework errors still surface normally.
