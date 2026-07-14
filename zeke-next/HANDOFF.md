# Zeke Next.js handoff

Last updated: 2026-07-14

## Working agreement

- This folder is the single source of truth for all Zeke Baba work.
- Keep implementation, research, decisions, open questions, and future-agent handoff notes inside this folder.
- Update this file after every material work session so another agent can continue without relying on chat history.
- Never place secrets in this file; keep them in `.env.local` and document only the variable names and setup status.
- User-provided reference site: `https://www.zekesolution.com` (redirects to `https://zekesolution.com/`).
- Reference homepage snapshot captured on 2026-07-14: `reference-homepage.html`.
- Reference positioning observed: "Zeke - Your Perfect PR Partner"; hero message "Where Creators Meet Global Brands"; primary audiences are brands and creators; Zeke Shield is a highlighted paid offering.
- Official public contact number supplied by the user: `+971 52 354 2485`; added as a clickable phone link in both the legacy and Next.js marketing footers on 2026-07-14.

## Project

- App: `C:\Users\SEO EXECUTIVE\Desktop\app\zeke-next`
- Local URL: `http://localhost:3000`
- Stack: Next.js 16, React 19, Tailwind 4, Supabase
- The legacy static HTML site remains separate and was not modified during this QA pass.
- Git operations and email-sender configuration were intentionally left untouched.

## Current status

QA update 2026-07-14:

- Full report: `QA_REPORT_2026-07-14.md`.
- Complete project/deployment assessment: `PROJECT_ANALYSIS_2026-07-14.md`.
- Lint, TypeScript, production build, public-page smoke tests, and anonymous auth guards pass.
- P1: migration 0002 blocks cross-user reads of `profiles`, while brand/creator screens rely on joins to that table for names and locations.
- P1: core submission, final-link, payment, and dispute transitions use multiple non-transactional database calls and can become partially applied.
- P2: some conditional updates do not distinguish zero affected rows from success.
- Live migration state and authenticated three-role browser workflows are still unverified.

The Next.js migration is feature-complete and the code-level QA fixes are implemented. The app still needs the database migrations applied and authenticated browser testing across creator, brand, and admin accounts before deployment.

Verification on 2026-06-19:

- `tsc --noEmit --incremental false`: pass
- `npm run lint`: pass
- `npm run build`: pass (31 routes generated)
- Runtime smoke test: `/`, `/login`, and `/update-password` return 200
- Runtime auth guards: `/creator`, `/brand`, and `/admin` redirect to `/login`
- Inter is bundled locally through `@fontsource-variable/inter`; builds no longer fetch Google Fonts.
- Production dependency audit: two moderate findings in Next.js's transitive PostCSS dependency. No non-breaking npm fix is currently offered; do not run `npm audit fix --force` because it proposes downgrading Next.js to 9.3.3.

## QA fixes implemented

- Password recovery now renders outside the signed-in auth redirect layout.
- Callback failures are shown on the login page, and callback redirects are allowlisted.
- Failed password-update profile lookup now reports an error instead of guessing a role.
- Offer, submission, review, final-link, payment, cancellation, and dispute actions enforce ownership and valid deal states.
- Rejected submissions can be resubmitted; brands can open private submission files through signed URLs.
- Creator-side accept/decline controls exist for brand cancellation requests.
- Final-link review UI exists for brands, with validated HTTP/HTTPS URLs.
- Dispute resolution restores the deal's previous status.
- Shield and dispute admin mutations use idempotent database functions.
- Cross-user notifications use a controlled database function.
- Shared role checks replace duplicated action-level role logic.
- Input limits and duplicate/race guards were added where identified by QA.

## Database work required

Apply these files in order using the Supabase SQL Editor:

1. `supabase/migrations/0001_notifications_related_deal.sql`
2. `supabase/migrations/0002_security_hardening.sql`

Migration 0002 adds:

- hardened signup-role handling and role/privilege protection
- operation-specific RLS policies
- deal, submission, and payment state-machine triggers
- secure notification, Shield, and dispute RPC functions
- private submission-storage policies
- dispute previous-status tracking
- uniqueness guards for agreements, payments, final links, submissions, offers, Shield requests, and disputes

Important: RPC-backed Shield, dispute, and notification actions will not work against the live project until migration 0002 is applied. Review existing data for duplicates before applying its unique indexes.

## Remaining live QA

Use real authenticated accounts to test:

1. Password-reset link through `/update-password`.
2. Creator accepts/declines offer and submits/re-submits content.
3. Brand reviews content, opens the private file, receives the final link, and marks payment sent.
4. Creator confirms payment and completes the deal.
5. Both cancellation directions, including decline.
6. Both parties raise a dispute; admin escalates/resolves it; deal status restores correctly.
7. Creator requests Shield; admin activates/rejects it.
8. Direct Supabase attempts cannot change role, Shield, deal state, submission review, or payment state outside allowed rules.

## Run locally

```powershell
cd "C:\Users\SEO EXECUTIVE\Desktop\app\zeke-next"
npm run dev
```

Then open `http://localhost:3000`.

## Main locations

- Server Actions: `actions/*.ts`
- Validation: `lib/validation/*.schema.ts`
- Supabase clients/types: `lib/supabase/*`
- Role guard: `lib/auth/roles.ts`
- Shared domain logic: `lib/domain/*`
- UI: `components/*`
- Routes: `app/*`
- Database migrations: `supabase/migrations/*`

## Deliberately deferred

- Email sender/domain configuration.
- Git, commits, pushes, and PR work.
- Vercel/DNS cutover until migrations and live QA pass.
