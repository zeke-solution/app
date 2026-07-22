# Zeke Next.js handoff

Last updated: 2026-07-22

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
- Git repository root: `C:\Users\SEO EXECUTIVE\Desktop\app`
- GitHub repository/remote: `https://github.com/zeke-solution/app`
- Production base: `main`; current publish branch: `agent/production-cutover`
- Current local preview: `http://localhost:3001`
- Stack: Next.js 16, React 19, Tailwind 4, Supabase
- The legacy static HTML site remains at the repository root for history only and is retired as a product target.
- The Next.js app under `zeke-next/` is deployed to Vercel and serves both custom domains over HTTPS. The current deployment was made directly from the verified local tree; publish the matching changes to GitHub next.

## Current status

### Vercel and DNS cutover: 2026-07-22

- Vercel production deployment `dpl_2C9tz3PKabKfvg68JuoUr8266rqp` is Ready at `app-fa4f60hug-mufeed-4343s-projects.vercel.app`. It was built from the verified local tree on Next.js 16.2.10 and generated all 32 routes.
- Project `mufeed-4343s-projects/app` uses Framework Preset Next.js and Root Directory `zeke-next`. The prior production deployment predated that root configuration and still served the retired root `index.html`; the 2026-07-22 deployment replaced it.
- `zekesolution.com` resolves to Vercel `76.76.21.21`; `www.zekesolution.com` is a CNAME to `cname.vercel-dns-0.com`. Both are attached as aliases to the new deployment.
- Cache-bypassed HTTPS probes returned 200 from both domains with the new Next.js hero and `/_next/static/` assets, not the legacy HTML. `/login` and creator registration return 200; anonymous `/creator` returns 307 to `/login`.
- Vercel Production now contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL=https://zekesolution.com`. `SUPABASE_SERVICE_ROLE_KEY` was intentionally not added because the admin client helper is unused by application code.
- Production migrations 0001-0003 were applied successfully to Supabase on 2026-07-22. The remaining launch gate is authenticated creator/brand/admin workflow QA.

### Supabase production migration: 2026-07-22

- Applied `0001_notifications_related_deal.sql`, `0002_security_hardening.sql`, and `0003_atomic_transitions.sql` to project `fslthsbjtgmdbabwcubs`. The migration ledger records all three versions.
- The hosted project contained operation-specific RLS policy names from an earlier unrecorded hardening pass. Migration 0002 now drops its target policy names before recreating them, making the migration reconcile that drift safely.
- Duplicate preflight found three campaign/creator pairs. Two contained an already-cancelled historical offer. The remaining pair contained a three-minute-old negotiating offer followed by an accepted active replacement. Migration 0002 preserves the old row and its three chat messages, marks only that superseded negotiation `cancelled`, and installs a partial unique index that permits cancelled history while allowing only one non-cancelled offer per campaign/creator.
- Post-migration verification: the stale deal `0d65d0d4-3f23-4644-a11b-c35b1e3a9495` is cancelled; active replacement `e4dd0ac6-667d-4690-b770-a75ba6146342` remains active; zero non-cancelled duplicate groups remain; the expected partial index exists; both new columns exist; and all six atomic transaction RPCs are present.
- Local regression after the migration reconciliation: ESLint pass, TypeScript pass, production build pass (32 routes, Next.js 16.2.10).

### Resume audit: 2026-07-22

- Owner decision (2026-07-22): Zeke is not live yet, the legacy HTML application is no longer needed, and the launch target is the existing Supabase project plus Vercel with the Namecheap domain. The shared-database blocker is resolved; retire the legacy application at cutover rather than preserving compatibility with it.
- The older copy at `C:\Users\SEO EXECUTIVE\Desktop\Project-Handoffs\Zeke\NextJS-HANDOFF.md` was read first, but its July 15 restart point is stale. This file reflects the later committed work and is the canonical continuation note.
- `main` is synchronized with `origin/main` at `073026e`. Atomic-transition work is already committed in `fa9a403`; later brand/homepage QA commits are also present. Do not reimplement P1 #2.
- Production migrations 0001-0003 are now applied and verified against project `fslthsbjtgmdbabwcubs`; the new columns, security policies, uniqueness guards, and six atomic RPCs are live.
- The local Supabase CLI metadata is linked to the correct project. `supabase/.temp/zeke-migrate.ps1` uses invisible password entry, a dry-run, and an explicit `APPLY` gate. The password is never stored in this handoff or source control.
- `.env.local` has the public Supabase URL/key and local site URL configured. `SUPABASE_SERVICE_ROLE_KEY` is blank. No secrets were added to source control.
- Current local verification on the existing working tree: `npm run lint` pass; `npx tsc --noEmit --incremental false` pass; `npm run build` pass with 32 routes on Next.js 16.2.10.
- `npm audit --omit=dev` reports one low-severity DOMPurify advisory inherited through `jspdf@4.2.1` (`dompurify@3.4.11`). No audit fix was applied during this audit.
- Pre-existing uncommitted work was preserved: root `.gitignore`, `zeke-next/package.json`, `zeke-next/package-lock.json`, `zeke-next/supabase/config.toml`, and `zeke-next/supabase/.gitignore`, plus the unrelated untracked root `HANDOFF.md`. Review ownership/scope before committing any of these.
- Required next action: publish the reconciled production source to GitHub, then run authenticated creator/brand/admin end-to-end QA.

### Homepage QA pass: 2026-07-19

- QA scope was explicitly narrowed to the Next.js application; the legacy HTML site is not part of the forward product work.
- Green: ESLint, `tsc --noEmit --incremental false`, production build (32 routes), public-route smoke tests, creator/brand/admin anonymous guards, role-specific registration links, mobile-menu interaction, FAQ content in initial HTML, all homepage hash targets, and responsive overflow checks at 320/360/390/414/768/1024/1280/1440px.
- Green: fresh production-browser run reported no console exceptions, HTTP errors, or non-aborted resource failures. Desktop and mobile full-page visual review found no clipping, broken wrapping, or hierarchy regressions.
- Resolved P2: exported `buttonClassName()` from the shared Button module and applied it directly to marketing `Link` elements. The rendered homepage now has zero nested interactive controls while retaining the exact branded button styles.
- Resolved P2: removed the `position: relative` override from `.brand-nav`; `TopNav` now computes to `position: sticky`. Homepage targets use `scroll-mt-20`, and mobile anchor QA places target content at 80px below the 65px header.
- Resolved P2: added the static `/terms` route with ten semantic `<details>` sections and corrected the footer link. The page has its own H1/main landmark, responsive layout, visible initial HTML, and contact/privacy links. The product-specific terms copy still requires qualified legal review before production launch.
- Resolved P3: the marketing layout now wraps page content in `<main>`. Browser QA reports exactly one main landmark on the homepage.
- Post-fix regression: zero nested controls, no missing hash targets, no horizontal overflow, and no console/runtime errors on the production bundle. The production preview remains available at `http://localhost:3001`.

### Homepage model restructure: 2026-07-19

- The owner supplied a long-form creator-protection homepage as an information-architecture reference and asked Zeke to follow that model while preserving the approved Purple + Indigo identity.
- Rebuilt the Next.js marketing homepage: split hero, deal-report product visual, audience CTAs, proof bar, creator/brand pain points, protection banner, six-step workflow, Free-vs-Shield comparison, platform differentiators, real-problem and brand-verification proof, support strip, FAQ/pricing, and closing CTA.
- Kept all copy, positioning, pricing, and visual assets specific to Zeke. The reference site's identity and photography were not copied; the hero visual is an original code-built Zeke campaign report.
- Updated the Next.js navigation and footer anchors to match the new sections.
- Product-direction decision: future homepage work targets the Next.js application only. The attempted legacy HTML restructure was reverted at the owner's direction; do not mirror new structure or design work into the root HTML site unless explicitly requested.
- Brand application remains the approved system: dark indigo hero/protection surfaces, white and soft-lilac reading sections, purple-to-pink gradients for primary emphasis, cyan for small supporting accents, Sora headings, and Inter body text.
- Next.js visual QA passed at 1440px desktop and mobile widths. No visible horizontal overflow, broken wrapping, or section-order mismatch was observed.
- Verification: `tsc --noEmit --incremental false` passes; `npm run lint` passes; and a clean `npm run build` passes with all 32 routes generated.
- Status: the restructure is local and uncommitted. The unrelated root-level `HANDOFF.md` remains intentionally untracked and must not be included in a future commit.

### Brand-board correction: 2026-07-19

- The owner rejected the initial flat Purple + Indigo re-skin and supplied a visual board showing the intended application: indigo as the base, purple-to-pink gradients for emphasis, cyan as a sharp supporting accent, soft neon glows, dark violet surfaces, Sora headings, and Inter body text.
- Corrected both the Next.js and legacy applications to follow that hierarchy rather than merely swapping hex values. Primary actions, headline emphasis, active navigation, logo punctuation, progress/chat actions, selected borders, and CTA surfaces now use the brand gradient; cyan/purple/pink are distributed as secondary highlights; core surfaces remain dark for contrast.
- Added `@fontsource-variable/sora` to the Next.js app and imported it locally. Added the same Sora variable font as `../fonts/sora-latin-wght-normal.woff2` for the legacy app, so its headings do not depend on a new remote font request.
- Added reusable Next.js brand treatments in `app/globals.css` (`brand-gradient-text`, primary/outline buttons, navigation, hero, panels/cards, CTA, avatar, sidebar, and active navigation). Shared `Button`, `Card`, `StatCard`, navigation, auth, marketing, and selected dashboard components now use them.
- Updated the legacy shared stylesheet and homepage treatment to match: gradient buttons, Sora display typography, multi-colour hero/CTA glows, purple/pink/cyan accents, gradient-border panels, dashboard cards/navigation, chat/progress actions, and semantic red for errors/rejections.
- Removed the obsolete `#0F3460`/`rgba(15,52,96,...)` blue from active Next.js and legacy sources. It remains only inside the historical `reference-homepage.html` snapshot, which was deliberately not edited.
- Visual QA passed for both codebases at 1440px desktop and a true 390px CSS mobile viewport. The layouts match each other and the supplied board much more closely; no horizontal overflow was observed.
- Verification: legacy JavaScript syntax checks pass for all six files; `tsc --noEmit --incremental false` passes; `npm run lint` passes; clean `npm run build` passes with all 31 routes generated.
- Deployment status: the legacy changes take effect only after a pushed `main` commit completes its GitHub Pages build; the Next.js application remains undeployed until the separate Vercel/database cutover.

### Session closeout: 2026-07-19

- Colour decision made: **Purple + Indigo won**, replacing Navy + Red (see [[zeke-brand-brief]]). Re-skinned BOTH codebases this session.
- **Legacy site re-skinned too, at the owner's explicit direction (heads-up for Codex):** the legacy site is normally Codex's territory, but Mufeed asked for it directly, so I applied the same palette across all 10 legacy files (`css/zeke.css`, 5 `*.html`, `js/{admin,auth,brand,creator}.js`) -- 686 mapped replacements + 5 favicon data-URIs. git diff is exactly 477 insertions / 477 deletions (pure in-place value swaps), line counts unchanged, no structural edits. Unlike zeke-next the legacy site hardcodes hex/rgb everywhere rather than using vars, hence the volume. Mapping used: dark `#0B0D1A→#0D0B16`, navy `#12152B→#1A1333`, card `#181C35→#241A4D`, border `#252A45→#322863`, accent `#E94560→#6366F1`, muted `#7B84A3→#8B8BB5`, light `#C8D0E7→#E5E7EB`; gold/green kept. Legacy has no `danger` split (it's being retired at cutover, so accent→indigo uniformly). NOT committed or deployed -- GitHub Pages still serves the old palette until someone commits+pushes. Backup of originals in scratchpad `legacy-backup/`.
- `app/globals.css`: the 9 `--color-*` tokens keep their NAMES (so every `bg-navy`/`text-accent` re-skins by value, zero component rewiring) and got new values -- base `#0d0b16`, surface `#1a1333`, card `#241a4d`, border `#322863`, accent indigo `#6366f1`, muted `#8b8bb5`, light `#e5e7eb`. Added three brand secondaries (`--color-purple #a855f7`, `--color-pink #ec4899`, `--color-cyan #22d3ee`) and a semantic `--color-danger #f43f5e`.
- Why a danger token: the new palette has no red, but the brief keeps "red for errors, green for success" for any direction. The old red accent had been doubling as the alert colour, so negative states (rejected submission, disputed deal, open-disputes counter) now use `danger` red while the brand accent is indigo. Added a `danger` variant to `BadgeVariant` + `components/ui/Badge.tsx`.
- `lib/domain/deal-status.ts`: active -> indigo, disputed -> danger red (it previously shared the red accent, so it stays alarming), muted grey shifted to indigo-grey; gold (pending states) and green (success) unchanged.
- Swept out every hardcoded hex/rgb that bypassed tokens: stat-card icons in admin/brand overview, `CreatorDealDetailView` rejected colour, `Sidebar` count badge, `CtaBanner`, `EntityDetailModal` Instagram tile, auth-form box-shadow glows (Login/UpdatePassword/verify), and the favicon square in `app/layout.tsx`.
- Verified: `tsc` clean, `npm run lint` clean, clean `npm run build` passes. Grepped the freshly built CSS -- zero old-palette values remain, indigo ships. NOT yet visually eyeballed in a browser (backgrounded dev server was flaky this session); worth a screenshot pass next time.
- Fonts NOT changed: brief calls Sora a "candidate" for headings, not locked, so left Inter as-is pending confirmation.

- P1 #2 (atomic workflow transitions) implemented at code level. New migration `supabase/migrations/0003_atomic_transitions.sql` adds one `security definer` function per transition: `submit_content_transaction`, `review_submission_transaction`, `submit_final_link_transaction`, `mark_payment_sent_transaction`, `confirm_payment_transaction`, `raise_dispute_transaction`, plus a `fmt_amount` helper mirroring `fmtNum()` so event-message amounts read identically.
- Each function takes `for update` on the deal row first, so concurrent attempts on one deal serialise and the status checks are sound. That let the follow-up writes become unconditional, which also closes QA P2 (the old `.eq("status", ...)` guards could match zero rows and report success).
- The five Server Actions in `actions/submissions.ts`, `actions/links.ts`, `actions/payments.ts`, `actions/disputes.ts` now each make a single `supabase.rpc()` call. The functions return null on success or a short error code; `lib/domain/transitions.ts` maps codes to the existing user-facing copy, so no wording changed.
- `AGENTS.md` is legitimate: `node_modules/next/dist/docs/` exists (422 files, Next.js 16.2.9). An earlier session's note calling it fabricated was wrong. Read those docs, not training-data assumptions.
- Verification: `tsc --noEmit` pass, `npm run lint` pass, `npm run build` pass.
- **The SQL was executed and tested**, against a throwaway local Postgres 17.5 (no Docker, no admin, no Supabase CLI needed -- see `supabase/tests/README.md`, which is reusable). Migrations 0001, 0002 and 0003 apply cleanly onto `../supabase/schema.sql`, and 44/44 assertions pass: all six transitions end to end, plus the negative cases (wrong role, wrong status, double review, double link, underpayment, foreign file path, stranger dispute, dispute on a closed deal) and dispute resolve restoring the pre-dispute status.
- A separate two-connection test (`supabase/tests/02_payment_race_test.cjs`) proves the `for update` lock does what the design claims: with two brands marking payment sent on one deal simultaneously, the second blocks, then returns a clean `wrong_status` instead of hitting the `payments_one_per_deal` unique index. Exactly one payment row results.
- Testing found one real bug, now fixed: `fmt_amount(500)` returned `'500.'` with a trailing dot where `fmtNum()` returns `'500'`, because Postgres's `FM` modifier drops trailing zeros but keeps the decimal point. Any deal under 1000 would have rendered "Payment of ₹500. sent by X". Caught only by running it.
- Still unproven: this ran against the hand-maintained `schema.sql`, not the live project. If production has drifted, a green local run does not guarantee a green live run. Diff the real schema before trusting it. Storage bucket policies are also not behaviourally covered (the shim stubs `storage.objects`).
- Next task: apply 0001, 0002, 0003 to the Supabase project, then live QA (restart point #1).

### Session closeout: 2026-07-15

- P1 #1 (cross-user `profiles` visibility) fixed at code level. Edited the `profiles_select` policy in `supabase/migrations/0002_security_hardening.sql`: it now also allows a brand to read influencer profiles and a creator to read brand profiles, mirroring the existing `influencer_profiles`/`brand_profiles` select policies. Verified by tracing all 26 `profiles` join sites in the app -- every one is own-row, admin, brand-reading-creator, or creator-reading-brand; no screen reads a same-role peer. profiles has no sensitive columns (id, role, display_name, location, created_at); email is in auth.users. Not yet run against a live DB -- needs verification after migration 0002 is applied (see restart point #1).
- GitHub CLI: logged out of BOTH accounts (`zeke-global` and `3S-dubai`). `gh auth status` reports no logged-in hosts. Run `gh auth login` before any push.
- Did NOT start the dev server this session. Note for next time: port 3000 is occupied by a different app ("Safe Driver Dubai"); start Zeke on port 3001 with `npx next dev -p 3001`.
- Next task: P1 #2 -- make the six core workflow transitions atomic (restart point #2).

### Session closeout: 2026-07-14

- GitHub CLI contains both `zeke-global` and `3S-dubai`; `zeke-global` was used for all Zeke pushes.
- The previously local-only Next.js application was secured with a root `.gitignore`, committed, and merged into `main` through PR #1.
- Official phone number `+971 52 354 2485` was added to both footers; the static-site update is live.
- The invisible Next.js lower CTA label was fixed with an explicit accent text color and visually verified.
- Decorative arrows were removed from primary action buttons in both applications and merged through PR #2.
- FAQ questions and answers now render visibly in the initial HTML without click-dependent dropdowns; merged through PR #3 for clearer crawling and accessibility.
- Latest GitHub `main` commit after PR #3: `c4d2b3d20521c4f07ac59f7080e088e033ced63d`.
- GitHub Pages successfully built that commit. The official domain still serves the legacy root `index.html`.
- Next.js checks after the FAQ change: lint pass, production build pass, 31 routes generated, and FAQ question/answer text confirmed in the initial HTML response.
- Local Next.js dev URL: `http://localhost:3000`. Start it with `npm run dev` if it is not already running.
- The root-level untracked `HANDOFF.md` is an older legacy-site note. Do not treat it as canonical; this file is the current handoff.

### Immediate restart point

1. DONE (database applied, 2026-07-22): Fixed the P1 cross-user `profiles` visibility/RLS mismatch. Authenticated UI verification of brand-to-creator and creator-to-brand names/locations remains part of live QA.
2. DONE (database applied, 2026-07-22): submission, approval, final-link, payment, payment-confirmation, and dispute transitions are live as atomic RPCs from `0003_atomic_transitions.sql`.
3. DONE (2026-07-22): migrations 0001-0003 are applied and directly verified on the official Supabase project `fslthsbjtgmdbabwcubs`.
4. DONE (2026-07-22): configured the public Supabase values and production site URL in Vercel without committing `.env.local`.
5. Run authenticated creator, brand, and admin end-to-end QA.
6. DONE (2026-07-22): Vercel Root Directory is `zeke-next`; apex and `www` DNS point to Vercel; both custom domains serve the Next.js app over HTTPS.

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

## RESOLVED: legacy compatibility is not required (decision 2026-07-22)

The owner confirmed that Zeke is not live yet and the legacy HTML site will be retired. Use the existing Supabase project, apply migrations 0001-0003 after backup/preflight, deploy `zeke-next` on Vercel, and then point the Namecheap domain to Vercel. The analysis below is retained only to explain why the migrations and legacy app must not run side-by-side.

The Next.js app and the live legacy static site share ONE Supabase project:
`fslthsbjtgmdbabwcubs`. Confirmed in `zeke-next/.env.local` and `../js/supabase.js`
(same URL, same anon key). The legacy site is what the official domain serves
today, and it writes to the database directly rather than through RPCs.

Migration 0002 is not additive. It drops and replaces RLS policies and revokes
column update privileges. Applying it to that shared project breaks the live
site immediately:

- **All legacy notifications fail.** 0002 replaces `notif_own` (a `for all`
  policy, which permitted insert) with select-only and update-only policies.
  There is no insert policy on `notifications`. Every direct
  `notifications.insert(...)` in `admin.js`, `brand.js`, `creator.js` stops
  working. The Next.js app is unaffected because it uses the
  `create_notification` RPC.
- **Admin Shield activation fails.** `revoke update on influencer_profiles` +
  a grant list that excludes `shield_active`/`shield_expires`, which is exactly
  what `admin.js:379` writes.
- **Admin Shield approve/reject fails.** `revoke update on shield_requests` with
  no grant back; `admin.js:378`/`:389` write directly.
- **Admin dispute resolve/escalate fails.** `revoke update on disputes` with no
  grant back; `admin.js:426`/`:436` write directly.

Column privileges are checked before RLS, so no policy change rescues these.

Consequence for launch: 0002 (and therefore 0003, which needs 0002's
`disputes.previous_deal_status` column) cannot be applied while the legacy site
is the live product. Options, in rough order of safety:

1. Apply 0002+0003 only at cutover, in the same window the domain moves from
   the legacy site to the Next.js app. Simplest, but makes cutover atomic and
   irreversible-ish.
2. Point the Next.js app at a separate Supabase project, migrate/copy data at
   cutover. Cleanest separation; most work.
3. Add compatibility grants/policies to 0002 so the legacy site keeps working
   (grant back the revoked columns, add a notifications insert policy). This
   re-opens the exact privilege holes 0002 exists to close, so it only makes
   sense as a short bridge.

The legacy site is Codex's territory per `../HANDOFF.md`, so option 3 or any
change to `js/*.js` needs coordination, not a unilateral edit.

## Database deployment complete

These files were applied in order to the hosted Supabase project on 2026-07-22:

1. `supabase/migrations/0001_notifications_related_deal.sql`
2. `supabase/migrations/0002_security_hardening.sql`
3. `supabase/migrations/0003_atomic_transitions.sql`

Migration 0003 depends on 0002: the transition functions assume 0002's state-machine triggers, column grants, and `disputes.previous_deal_status` column exist. The production ledger confirms the correct 0001 -> 0002 -> 0003 order.

Note: once 0003 is applied, the app calls these RPCs for every core transition.
Applying 0002 without 0003 leaves submission, final-link, payment, and dispute
actions broken, because the actions no longer do the writes themselves.

Migration 0002 adds:

- hardened signup-role handling and role/privilege protection
- operation-specific RLS policies
- deal, submission, and payment state-machine triggers
- secure notification, Shield, and dispute RPC functions
- private submission-storage policies
- dispute previous-status tracking
- uniqueness guards for agreements, payments, final links, submissions, offers, Shield requests, and disputes

RPC-backed Shield, dispute, and notification actions are now installed. Duplicate data was reviewed and reconciled without deleting deals or messages; see "Supabase production migration" above.

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

## Known gaps (not bugs, noted while doing other work)

- The brand is never notified when a creator submits the final link, nor when a creator confirms payment. Neither `submitFinalLink()` nor `confirmPayment()` ever sent a notification, and `0003_atomic_transitions.sql` deliberately preserved that rather than mixing a behaviour change into a correctness refactor. Both are one insert inside the relevant function if the product wants them.

## Deliberately deferred

- Email sender/domain configuration.
- Authenticated creator/brand/admin live workflow QA.
