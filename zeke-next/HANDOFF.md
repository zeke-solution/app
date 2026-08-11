# Zeke Next.js handoff

Last updated: 2026-08-11

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
- Production branch: `main`
- Local preview command: `npm run dev -- -p 3000` from this folder
- Stack: Next.js 16, React 19, Tailwind 4, Supabase
- The legacy static HTML site remains at the repository root for history only and is retired as a product target.
- The Next.js app under `zeke-next/` is deployed from the HEAD of `main` to Vercel and serves both custom domains over HTTPS. Vercel Production is Ready on both custom-domain aliases.

## Current status

### Campaign creator tracking: 2026-08-11

- Brand Campaigns now keeps each reusable campaign as the parent record and shows every invited creator directly inside it.
- Each campaign retains its brief summary, commercial terms, deadline, and aggregate recipient summary. Invited creator rows add avatar/name, truthful workflow status, fee, invitation date, and the correct Chat or Deal action.
- Desktop uses aligned Creator, Status, Fee, Invited, and Action columns. Mobile switches to labelled creator cards so the page does not require horizontal scrolling.
- The UI reuses the existing brand-owned campaign and deal query; there is no database migration or workflow-state change. The negotiating state remains labelled Negotiating because the database does not distinguish a fresh invitation from an active negotiation.
- TypeScript, ESLint, git diff checks, and the optimized 41-route production build pass.

### Borderless dashboard surfaces: 2026-08-11

- Creator, brand, and admin workspaces now remove neutral outline lines from cards, inset boxes, list/table rows, and their internal neutral separators. Marketing and auth surfaces are unchanged.
- Visual hierarchy comes from the existing light canvas, white or tinted surface contrast, spacing, and a restrained two-layer shadow. Clickable cards receive only a slightly stronger hover shadow; no page movement or transition was added.
- Form fields, ordinary action buttons, tabs, colored status warnings, error states, and destructive confirmations retain visible boundaries. Only full-width button rows are treated as data rows, so neutral secondary buttons do not lose their affordance.
- Authenticated browser QA passed at 1440 x 1000 and 390 x 844: desktop found 6 representative neutral surfaces with zero opaque borders and all 6 elevated; mobile found 3 data rows and 3 internal separators, all transparent; all 13 text/select/textarea controls remained bounded; both document widths exactly matched their viewports. The temporary QA admin was deleted and no destructive action ran.
- TypeScript, ESLint, the optimized 41-route production build, and `git diff --check` pass.

### Cross-device password recovery and admin master controls: 2026-08-11

- Password recovery no longer depends on the PKCE verifier stored in the browser that requested the email. New recovery mail sends Supabase's one-time token hash to `/auth/confirm`, where an explicit POST verifies it and creates the recovery session before `/update-password`.
- The intermediate Continue screen is intentional: GET requests do not consume the token, which protects links from automatic email security scanners and previews. A reset requested on desktop can therefore be completed from the newest email on mobile.
- Production Auth redirect URLs include the apex, `www`, and localhost `/auth/confirm` routes. The branded Resend sender remains `no-reply@zekesolution.com`; the sender was not the cause of the invalid-link behavior.
- Old recovery emails can remain invalid because they use the former PKCE callback. Always request one fresh email after this release and use only the newest link.
- Admin now has typed-confirmation master removal controls for non-admin users, campaigns, deals, disputes, Shield requests, Shield cases, and legal providers. Entering `REMOVE` is required and the destructive button stays disabled until it matches exactly.
- User, campaign, and deal removal also cleans their dependent workflow records and known Storage objects. Administrator accounts are deliberately protected from dashboard deletion.
- Migration `0020_admin_removal_audit.sql` is applied to production. It adds an append-only, admin-readable Removal Log; application users cannot insert, update, or delete audit entries.
- Destructive authenticated QA used a temporary admin but never submitted a removal. Exact 390 x 844 browser QA passed the account control, disabled confirmation state, modal fit, and Removal Log fit. The temporary account was deleted afterward and the final QA-account count was zero.
- Vercel and local server configuration now use Supabase's publishable and server-only secret API keys. The legacy anon/service API keys were disabled after successful production verification on 2026-08-11. The server secret must never be exposed through a `NEXT_PUBLIC_` variable or client component.
- Release verification passed TypeScript, ESLint, `git diff --check`, the optimized 41-route build, linked database lint, migration dry-run/push, recovery browser QA, and authenticated admin browser QA.
- A production recovery proof on 2026-08-11 created a temporary confirmed user at Resend's official delivery-test address, requested a new email, loaded the Zeke Continue page, verified the token from a separate session, updated the password, and signed in with it. The QA user was deleted and the final recovery-QA user count was zero.
- The follow-up hardening at commit `236aced` removed the unnecessary `type` query parameter from new email links. `/auth/confirm` now accepts the token hash alone and fixes the type to `recovery` server-side before Supabase verification, avoiding mobile mail-client rewriting without weakening token validation. The hosted Supabase recovery template has the same one-parameter link.
- The owner then confirmed that a fresh reset for the correct account works on mobile; the reported repeat failure came from entering the wrong email address. The reset result keeps account existence private but now displays the exact submitted email and offers a clear correction action.

### Google sign-in foundation and guarded onboarding: 2026-08-10

- Google is implemented as an optional Supabase Auth provider; email/password and Resend sender `no-reply@zekesolution.com` remain unchanged.
- Migration `0019_google_oauth_onboarding.sql` is applied to production. OAuth users without explicit Zeke role metadata are created as restricted `pending` profiles with no creator/brand row. They cannot enter any dashboard.
- The authenticated `complete_google_onboarding` RPC requires a real Google identity, accepts only Creator or Brand, validates the full role profile again in PostgreSQL, creates the role row atomically, and permanently closes onboarding. It cannot create an admin.
- Existing Zeke users who add/sign in with a matching verified Google email retain their existing profile and role. New users complete the same required Creator or Brand details at `/onboarding`.
- Login and Registration contain the Google controls behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. Production Supabase currently reports Google disabled and the public flag is not set, so the production UI does not expose an incomplete provider.
- Local enabled-state QA passed at a true 390 x 844 viewport: Login and role-aware Registration each show one Google control, both report `innerWidth=clientWidth=scrollWidth=390`, and anonymous `/onboarding` redirects to `/login`.
- TypeScript, ESLint, the optimized 39-route build, migration dry-run/push, remote migration reconciliation through 0019, and linked database lint pass.
- Remaining activation: create the Google Web OAuth client, add the Supabase callback URI, save the client ID/secret directly in Supabase, verify a new and existing-account flow, then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and redeploy. Exact steps are in `docs/GOOGLE-AUTH-SETUP.md`; never send the client secret in chat or commit it.

### Dashboard app-interface normalization: 2026-08-10

- Creator, brand, and admin workspaces now use a conventional application shell: a 240 px desktop sidebar, a flat dark app bar, and a responsive content canvas up to 1280 px instead of the former narrow 900 px column.
- `components/layout/PageHeader.tsx` provides the shared top-level page hierarchy and section headings. Overview, list, profile, campaign, discovery, Shield, and admin operations pages now state their purpose consistently and place counts or actions in a predictable header slot.
- Signed-in surfaces are deliberately quieter: white cards, 12 px corner radius, hairline borders, minimal shadow, restrained badges, 14 px base copy, and a 12 px floor for compact metadata. Marketing styling and the formal agreement document remain separately scoped.
- KPI cards use a familiar label/value pattern. Deal, admin-deal, and user-directory lists use aligned labelled columns on desktop while retaining the previously verified labelled field cards on mobile.
- Role overviews use balanced desktop sections for platforms/activity, campaigns/creators, and admin attention queues/recent deals. Discovery filters are grouped into a standard toolbar rather than floating controls.
- No workflow, Supabase query, authorization rule, mobile bottom navigation, or deal-state behavior changed. The removed page-transition animation remains removed.
- Verification passes: TypeScript, ESLint, `git diff --check`, the optimized 38-route build, a 1440 px desktop visual review, and true 390 x 844 device emulation with `innerWidth=390`, `clientWidth=390`, and `scrollWidth=390`. No authenticated credentials were handled, so one owner click-through with real creator, brand, and admin data remains the final acceptance check.

### Performance and dashboard-polish release: 2026-08-10

- Feature commit `f88f1f6` is on `main`. Vercel Production deployment `5833234962` succeeded at `https://app-pbiv7l9an-mufeed-4343s-projects.vercel.app`; both custom domains return HTTP 200, protected role routes return HTTP 307 to `/login`, and the new 31-day image cache header is live.
- Follow-up: the dashboard page-transition animation has been removed after production feedback that it did not feel right. Standard Next.js navigation remains; loading improvements and responsive labelled fields are unchanged.
- Follow-up: the code-built campaign-progress graphic has been removed from the marketing hero at every viewport width. The hero now uses one balanced content column on desktop and keeps the existing compact mobile actions.
- Public loading work now uses hashed local font preloads, correctly sized static logo imports, 31-day image caching, later-only `content-visibility`, gradient-only mobile card artwork, a server-rendered marketing nav shell, and an idle-loaded notification panel.
- Protected requests use Supabase `getClaims()` with the project's asymmetric ES256 signing key, avoiding a repeated Auth-server request while retaining signed-token validation and RLS/profile authorization.
- Deal, creator, admin-deal, user-directory, and entity-detail rows now show labelled responsive field grids instead of compressed unexplained mobile columns.
- Five candidate mobile Lighthouse runs have a median score of 96, FCP 913 ms, LCP 2.818 s, Speed Index 913 ms, TBT 45 ms, and 304.7 KiB transfer. Transfer is 65.4 KiB or 17.7% below the controlled local before trace. Final desktop Performance is 100 with 635 ms LCP.
- The final separate audit is 100 Accessibility, 100 Best Practices, and 100 SEO. TypeScript, ESLint, the 38-route production build, `git diff --check`, zero-vulnerability dependency audit, route redirects, cache headers, true 390 x 844 responsive browser assertions, menu interaction, and fonts all pass.
- No account credentials or signed-in browser session were handled. The remaining acceptance check is one creator/brand/admin signed-in visual click-through to confirm real data density.
- Full evidence and remaining guardrails are in `docs/PERFORMANCE-DASHBOARD-QA-2026-08-10.md`.

### Campaign-first Discover, compact mobile UX, and Shield checkout: 2026-08-10

- Login and Sign-up now use a dedicated mobile auth fit policy: 100dvh, compact card padding, safe word wrapping, 16 px form controls, and one-column platform fields below 360 px. Exact Chrome QA at 390 x 844 and 320 x 700 found zero horizontal overflow and zero vertical-text cases; Login and Sign-up step 1 fit the initial viewport, while the longer creator details step scrolls normally.
- Auth typography has a deliberate hierarchy: form content is 16 px on mobile, page subtitles are 14 px, section titles and field labels remain visually distinct, and secondary descriptions use smaller muted text with readable line height.

- Discover Creators now sends an existing active campaign brief instead of opening a second custom-campaign form. The picker shows saved platform, niche, deadline, and fee, and links brands to create a complete brief when none exists. The server still checks campaign ownership and active status, skips already-sent recipients, and the database unique index remains the final duplicate-send guard.
- The shared mobile wording rule no longer breaks words at arbitrary characters. Dashboard type is compact again, shared buttons preserve complete words, and representative two-column cards and actions pass at 390 x 844 with zero vertical-text cases and zero horizontal overflow.
- Mobile marketing now hides the desktop campaign-record illustration, keeps Create account and Log in above the first viewport, and uses an overlay burger menu that does not move page content. Exact QA measured a 390 px document width, both actions ending at y=472, the hero visual hidden, and the fixed menu beginning at y=72.
- The chat composer is explicitly fixed above the 64 px mobile bottom navigation. Exact QA measured the composer at y=713-780 and the navigation at y=780-844, with no gap, overlap, or horizontal overflow.
- Sign out was removed from the dashboard top-right. Desktop keeps it at the bottom of the sidebar. Creator and brand mobile users sign out from Profile, and admin mobile has a dedicated Account destination.
- All production creator Shield flags and expiries were cleared while preserving all 6 profiles. The final audit reports 4 creator profiles, 0 active Shield memberships, 0 Shield expiries, and one retained Fida Sherin profile.
- `/creator/shield/payment` now provides the honest one-month ₹1,999 plan summary, no-automatic-renewal language, scope exclusions, payment-verification state, and no raw card collection. If `ZEKE_SHIELD_PAYMENT_URL` is configured with an HTTPS provider link, secure checkout appears; otherwise users request verified payment instructions and admin activation remains payment-gated.
- Production currently contains one active campaign (`Curios`) and two negotiating deals (`Test` and `Curios`) created on 2026-08-10 Dubai time. This release did not create or delete them.
- Browser QA passed on exact 390 x 844 mobile and 1440 x 1000 desktop viewports. TypeScript, full ESLint, `git diff --check`, the optimized production build, and linked Supabase database lint all pass.
- Release commit `8ec398e` is on `main`. Vercel production deployment `dpl_91nyAu2jmBcNCmfVPajf1ba7wPpz` is Ready on the apex and `www` aliases with dynamic functions in `sin1`. Live smoke checks return 200 for the homepage and 307 to `/login` for anonymous Shield payment, Discover, and admin Account requests.

### Required infrastructure follow-up

- Add Cloudflare protection before broad launch: onboard the apex and `www` records without breaking Vercel verification, use SSL/TLS Full (strict), enable managed WAF rules, add rate limits for auth and write-heavy routes, review bot protection, and retest Supabase Auth callback and reset URLs after DNS cutover.
- The same app can be packaged as an Android APK. Finish mobile-web acceptance first, then use Capacitor for the recommended Play Store path because Zeke needs push notifications, deep links, file uploads, camera access, and controlled native updates. A Trusted Web Activity is faster but offers less native control.

### Production profile-preserving reset: 2026-08-10

- The owner requested a fresh production slate while retaining every account and profile. The reset preserved all 6 Auth identities, all 6 `profiles` rows, 4 `influencer_profiles`, 1 `brand_profiles` row, the admin profile, creator handles/details, Shield membership fields, and the single saved avatar object.
- The retained profile audit has no Auth users without a profile and no profiles without an Auth identity. All 6 retained email identities are confirmed.
- That reset reached zero transactional rows. Production later received one active campaign and two negotiating deals; preserve them unless the owner explicitly requests another reset.
- The `submissions`, `shield-case-files`, `payment-proof`, and `agreements` Storage buckets contain zero objects. The `avatars` bucket still contains the one retained creator DP.
- The reset used the service-role key only in process memory. No key, password, temporary reset utility, or personal profile list was written to source control.

### Mobile chat, campaign workspace, and shared creator DP: 2026-08-10

- Brand and creator chat routes now reserve the exact visible workspace with `100dvh`. The message history owns internal scrolling and the composer remains at the bottom above mobile navigation, including when the visual viewport is reduced by an on-screen keyboard.
- The Brand Campaigns page is now the complete campaign workspace. It shows reusable published briefs, every one-to-one campaign sent from Discover Creators, recipient counts, negotiation/acceptance/decline progress, creator identity, and the correct Chat or Deal destination.
- A successful direct creator send now returns to Campaigns instead of the accepted-only Deals list. The established navigation rule remains intact: negotiating records open Chat; only accepted workflow records open Deals.
- Campaign creation is a structured three-part brief with labelled fields, helper copy, inline validation, mobile-safe controls, and a readiness summary. Migration 0016 stores platform, objective, deliverables, creator requirements, usage rights, exclusivity, and payment terms; bulk offers inherit the applicable platform and commercial terms.
- Creator DPs now appear to brands in discovery cards, campaign recipient selection, direct campaign records, chat lists and headers, and accepted-deal cards. Migration 0017 persists a versioned public avatar URL after each replacement upload, preventing another user from seeing a stale one-hour cached image while keeping the owner-only avatar path and narrow authenticated RPC. Migration 0018 adds the same one-time version token to avatars uploaded before this release, so the already-uploaded DP refreshes without another upload.
- Production migrations reconcile through 0018 and linked database lint is clean. The new campaign columns return HTTP 200 through PostgREST, while an anonymous avatar RPC call remains denied with HTTP 401 and PostgreSQL code 42501.
- That release's earlier flex-composer QA passed at 390 x 844 and 390 x 500. The current campaign-first release supersedes it with an explicitly fixed composer that touches the mobile navigation without a gap or overlap.
- Final verification passes: TypeScript, full ESLint, `git diff --check`, optimized 36-route production build, zero-vulnerability dependency audit, migration ledger, database lint, and targeted production API security checks.

### Creator DP permission repair: 2026-08-10

- Root cause confirmed: migration 0012 added `profiles.avatar_url` after migration 0002 had restricted authenticated profile updates to `display_name` and `location`. Storage accepted the DP object, then the direct profile update failed with a table permission error.
- Migration 0014 adds `set_profile_avatar`, a narrow security-definer RPC that requires a signed-in user, validates the caller-owned avatar path and MIME extension, confirms the Storage object exists, validates the public Supabase URL, and updates only that caller's profile.
- No broad `avatar_url` column update grant was added. Migration 0015 explicitly revokes the Supabase default anon execute grant; anonymous calls now return HTTP 401 with PostgreSQL code 42501.
- The avatar Server Action now calls the controlled RPC. The uploader removes a newly orphaned object after a failed save and removes a replaced old avatar only after the new profile reference succeeds.
- Production migrations reconcile through 0018 and linked database lint is clean. TypeScript, ESLint, `git diff --check`, the optimized 36-route build, and the production dependency audit pass.
- Final user-level confirmation is a retry from an existing signed-in creator browser after the matching app deployment; no account password or session token was handled during this repair.

### Mobile dashboard readability and viewport QA: 2026-08-10

- Fixed the remaining unreadable blue dashboard cards at the shared source. The reusable `.brand-card` retained a hard-coded dark marketing gradient while signed-in text correctly used dark light-workspace tokens; dashboard cards now use a white surface, visible border, and restrained shadow without changing marketing cards.
- Mobile signed-in typography now uses a compact readable hierarchy: 13 px normal compact labels, 12 px secondary labels, 11 px micro metadata, and 16 px form fields to prevent iOS input zoom. The formal agreement preview is explicitly exempt so its letterhead layout stays stable.
- The dashboard content area is constrained to the viewport, clips accidental horizontal paint overflow, and wraps long user-generated text. The four mobile overlays remain full-height `100dvh` sheets with internal scrolling instead of floating desktop dialogs.
- Exact Chrome device emulation at 390 x 844 reported `innerWidth=390` and `scrollWidth=390`. Visual review confirmed two-column stat cards, long campaign references, status chips, inputs, and primary actions remain fully inside the screen.
- All dashboard semantic foreground colors pass WCAG AA on white. The lowest measured contrast is muted text at 5.24:1; the other semantic colors range from 5.36:1 to 14.87:1.
- Verification passed: exact mobile render, compiled CSS assertions, TypeScript, ESLint, `git diff --check`, zero-vulnerability production dependency audit, optimized 36-route production build, mobile-overlay assertions, live CSS checks, and public/protected route smoke tests.
- Release commit `fb122d3` is on `main`. Vercel Production is Ready and aliased to both production domains; dynamic functions remain in Singapore (`sin1`).

### Dashboard contrast, media uploads, mobile overlays, and security QA: 2026-08-09

- Replaced the blanket signed-in `text-white` override with semantic light-workspace foreground tokens. Headings, labels, fields, placeholders, status colors, buttons, and informational cards stay readable on white while dark navigation and the official agreement letterhead retain white text.
- All normal dashboard palette colors were checked programmatically against white and meet WCAG AA 4.5:1 or better. The lowest result is muted slate at 4.76:1.
- Fixed small-image submissions being rounded to `0.0 MB` and rejected. File sizes retain three decimals, failed record creation removes its uploaded object, and content uploads accept JPG, PNG, WebP, HEIC, and HEIF.
- Submissions use Supabase TUS resumable uploads in required 6 MB chunks with retry and visible progress. The app and bucket are set to 100 MB by live migration `0013_submission_uploads_100mb.sql`.
- Supabase is still on Free, so its hosted global Storage ceiling remains 50 MB. To activate 50-100 MB uploads, upgrade Supabase and set the global Storage limit to at least 100 MB. The bucket migration cannot override the plan ceiling.
- Offer, campaign-send, admin-detail, and brand offer-edit overlays are full-screen `100dvh` sheets on mobile with safe-area padding and internal scrolling. Desktop keeps centered cards.
- Next.js and its ESLint config are on stable 16.3.0. The production dependency audit reports zero known vulnerabilities.
- Logic QA reconfirmed accepted-only Deals, negotiation in Chats and Offers, cancellation state and database guards, creator completed-chat control, outside-click notifications, and standard versus Shield dispute separation.
- Verification passed: TypeScript, ESLint, `git diff --check`, the optimized 36-route build, migration reconciliation through 0013, database lint, production routes, aliases, and Singapore runtime inspection. The SQL regression suite was not rerun locally because Docker and local Postgres are unavailable.
- Feature commit `54abe5e` is on `main`. Production deployment `dpl_CcUbAptAKY2fvZbJc1zQoFTozsre` is Ready on both domains with dynamic functions in Singapore (`sin1`).
### Dashboard identity, creator controls, public profiles, auth email, and cache: 2026-08-09

- Dashboard Zeke logos now route to the signed-in role home (`/creator/overview`, `/brand/overview`, or `/admin/overview`) instead of leaving the app for the marketing site.
- Dashboard content uses a light canvas with white cards while the global top navigation, side navigation, and mobile navigation remain dark. The shared loading skeleton was adjusted for the light work area.
- Notification dropdowns and realtime popup cards close reliably on outside pointer interaction through document-level containment checks.
- Migration `0012_creator_profiles_and_chat_control.sql` is applied to production. It adds profile avatars, the public avatars Storage bucket and owner policies, unique case-insensitive creator handles, curated public creator-profile RPC access, completed-chat control, and a database trigger that blocks brand text messages after a creator closes a completed conversation.
- Creators can close or reopen brand messaging only after successful completion. Brands retain the conversation record but see a disabled composer when closed. The restriction is enforced in the server action and database, not only in UI.
- Creator profiles now support JPG, PNG, or WebP DP upload up to 5 MB, show the uploaded image in the dashboard sidebar, and provide a share link at `/c/{handle}`. Public output is curated and excludes email, private messages, deal amounts, and private case data.
- Admin dispute cards now label `Standard dispute` versus `Shield protected`. Every dispute remains in the general dispute record; active Shield coverage additionally creates a dedicated Shield coordination case.
- Hosted Supabase confirmation, recovery, and magic-link/OTP email templates are branded with Zeke's official logo, colors, security copy, styled code, and buttons. Local template sources are versioned in `supabase/templates` and referenced from `supabase/config.toml`.
- Password reset intentionally keeps generic account-existence wording to prevent email enumeration. The result shows the exact address the visitor submitted and a `Wrong email? Change it` action, plus spam-folder, spelling, and registration guidance, without disclosing whether that address is registered.
- Safe caching is enabled for public creator profiles (5 minutes with immediate invalidation after creator updates) and stable `/images/*` assets (1 day plus stale-while-revalidate). Private dashboard, deal, chat, payment, and dispute data is not shared-cached. The remaining infrastructure latency is primarily the Singapore Vercel to Tokyo Supabase region gap.
- Browser push is documented in `docs/PUSH-NOTIFICATION-SETUP.md` but not enabled until the OneSignal App ID, server key, service worker, user association, and delivery worker are configured. Existing in-app realtime notifications remain active.
- Verification: TypeScript, ESLint, `git diff --check`, full Next.js 16.2.10 production build with 36 routes, linked migration reconciliation through 0012, linked database lint, anonymous public-profile RPC smoke test, and anonymous chat-control denial all pass.
- Deployment status: commit `0a1c720` is on `main`; Vercel deployment `dpl_GyXsDzg7ezy4PiANYD4WwTinYSvz` is Ready and aliased to both production domains. Dynamic functions are in Singapore (`sin1`). Live checks return 200 for `/` and `/reset`, 404 for an unknown public creator handle, 307 from anonymous `/admin` to `/login`, and the official logo returns the new one-day cache header.
### Production remediation, admin, capacity, and performance: 2026-08-09

- Created `mufeed@zekesolution.com` as a confirmed Supabase Auth user with profile role `admin`. A one-time recovery flow was opened directly in the browser so the owner can choose the password. No password was emailed, printed, or stored. Production now has 3 auth users and 1 admin profile.
- Verified the Auth email model: registration sends a confirmation link and reset sends a recovery link. Zeke never emails passwords. Custom SMTP is Resend (`smtp.resend.com`) from `no-reply@zekesolution.com`; confirmation is required; the project limit is 30 Auth emails/hour; CAPTCHA is currently off.
- Password-reset success copy now says a link will arrive only if an account exists. This preserves Supabase's account-enumeration protection and avoids falsely promising delivery to nonexistent mailboxes.
- Applied migration `0011_realtime_and_workflow_notifications.sql` to production. It publishes `deal_messages` and `notifications`, adds the database chat-content guard, and adds atomic brand alerts for final-link submission and payment confirmation.
- Production migration history matches through 0011 and linked `db lint --level error` is clean. A self-cleaning live two-session retest passed 8/8 checks: both Realtime feeds, both message constraints, both RPC transitions, and both new brand notifications.
- Fixed stale cancellation controls. The brand overview now hides Accept/Decline once a deal is completed, cancelled, or disputed; the database duplication guard was already correct.
- Verified actual plans: Supabase Free and Vercel Hobby. Current Postgres size is 13 MB. The practical current limits and upgrade advice are recorded in `docs/PRODUCTION-CAPACITY-2026-08-09.md`.
- Aligned submission validation with the live Supabase Free 50 MB file ceiling. Raise the application constant only when the Storage plan and bucket setting are upgraded together.
- Pre-change mobile Lighthouse measured 70/100, 2.1s FCP, 3.4s LCP, 770ms TBT, zero CLS, 40ms server response, and 550 KiB transfer. Below-the-fold homepage sections now use `content-visibility: auto`, and Vercel functions are configured for Singapore (`sin1`) near the Tokyo database.
- Local verification passes: ESLint, TypeScript, full Next.js 16.2.10 production build with 36 routes, and `git diff --check`.
- Release commit `161053a` is on `main`. Vercel deployment `dpl_HEBM5z5SCA74yijWucmth9ET6YKy` is Ready and aliased to both production domains. Dynamic login/register responses confirm Singapore (`sin1`) execution. Live `/`, `/login`, and `/register` return 200; anonymous `/admin` returns 307 to `/login`.
- Post-release Lighthouse stayed at 70 overall while main-thread work improved from 5.3s to 3.6s, JavaScript execution from 1.4s to 1.1s, TBT from 770ms to 640ms, and transfer from 550 KiB to 417 KiB.
- Deal navigation now separates negotiation from delivery. Brand and creator Deals lists show only accepted workflow records and exclude negotiating and cancelled statuses. A direct negotiating deal URL redirects its party to the matching Chat; creators still accept or decline from Offers. Offer send, accept, and decline actions revalidate the affected Chat and Deals screens.
- Agreements now use the official Zeke document system in both the app and PDF: official white logo on navy letterhead, purple-magenta rule, unique ZK-AG reference, party acceptance cards, locked campaign terms, record notice, and footer. A representative long-form sample was rendered and visually checked as one A4 page.
- Feature commit 6c4bec0 is on main. Production deployment dpl_CoUkqJkXr6DpmNvuLFQx9cZ9b9gY is Ready and aliased to zekesolution.com and www.zekesolution.com. Deployment inspection confirms dynamic functions in Singapore (sin1). Live root returns 200 and protected Deals and Agreements routes redirect anonymous users to login.
### Ten problematic deals production QA: 2026-08-09

- Completed live production run `QA-20260809113327` against the retained creator and brand accounts. Ten QA deals remain for inspection; the temporary admin identity was removed.
- Result: 216 of 218 checks passed. All core state-machine, RLS, atomic transition, payment-race, cancellation, dispute, Shield, consent, legal-provider, evidence, and outcome guards passed.
- Confirmed gap: `pg_publication_tables` contains no public tables for `supabase_realtime`. Live chat and notification-popup subscriptions therefore time out in production. No publication fix was applied during this diagnostic task.
- Confirmed gap: whitespace-only direct chat inserts pass the database even though `actions/chat.ts` blocks them. The inserted QA row was immediately deleted.
- Confirmed gaps: final-link submission does not notify the brand, and payment confirmation does not notify the brand.
- Final run data: 1 campaign, 10 deals, 45 messages, 5 submissions, 3 final links, 2 payments, 9 agreements, 2 disputes, 44 notifications, 1 activated Shield request, 1 resolved Shield case, 13 case updates, 1 evidence record, 2 labelled QA providers, and 6 Storage objects.
- Scenario 9 remains disputed and escalated with a pending cancellation to demonstrate the close guard. Scenario 10's Shield case and dispute are resolved, and the deal was restored to active.
- Detailed evidence and recommended corrections: `docs/QA-PROBLEM-DEALS-2026-08-09.md`.
### Production fresh-slate reset: 2026-08-09

- Retained exactly two confirmed production accounts and their required role rows: one creator and one brand. Deleted the unconfirmed QA alias and every other prior account.
- Removed all campaigns, deals, deal messages, submissions, final links, payments, agreements, disputes, notifications, Shield requests, Shield cases, case updates, case documents, guardians, and legal providers.
- Removed the sole uploaded QA image through the linked Supabase Storage API. The final database audit reports zero storage objects and zero rows in every transactional table.
- Final account audit reports 2 auth users, 2 profiles, 1 influencer profile, and 1 brand profile.
- There are zero admin profiles after the requested reset. Admin dashboard access requires an explicit future decision to promote one retained account or create a separate admin account.
### Deal closure guard, notification popups, and dashboard speed: 2026-08-09

- Fixed the close-during-dispute edge case at all three layers. The creator and brand screens disable cancellation changes during a dispute, `actions/deals.ts` rejects cancellation acceptance or decline, and migration `0010_active_dispute_close_guard.sql` prevents any deal with an open or escalated dispute from becoming completed or cancelled.
- Applied migration 0010 to linked production Supabase project `fslthsbjtgmdbabwcubs`. The local and remote migration ledgers match through 0010, and `supabase db lint --linked --level error` reports no schema errors.
- Added a SQL regression covering the previously missed order: request cancellation, open a dispute, then attempt to accept cancellation. The test asserts that the database blocks the close and leaves the deal disputed. The local throwaway Postgres harness was unavailable in this environment, so this new assertion has not yet been executed locally.
- Upgraded `components/layout/NotificationsPanel.tsx` from a bell-only live feed to real in-app popups. Realtime inserts are prepended directly, up to three popup cards display, cards auto-dismiss after seven seconds, opening one marks it read, and related-deal notifications route to the correct creator or brand detail page.
- Browser push while the app is closed remains deliberately separate. It needs notification permission, a service worker, stored push subscriptions, and a server or webhook delivery path.
- Reduced identified lag sources by reusing a singleton browser Supabase client, avoiding a second notification query on every Realtime event, adding dashboard route loading skeletons, and replacing the brand campaign action's full-page anchor with a Next.js `Link`.
- The official logo update remains complete in the shared navigation, dashboards, auth shell, footer, homepage story card, and favicon using the approved full wordmark and compact mark assets.
- Verification passed on the current source: TypeScript, ESLint, `git diff --check`, a full Next.js 16.2.10 production build with 36 routes, linked production migration reconciliation, and linked database lint.
- Deployment status: migration 0010 and application/UI release `fac490f` are live. Vercel completed successfully, and live probes returned 200 for `/`, `/login`, and the official full-logo asset.

### Official logo, homepage polish, and signup verification: 2026-08-08

- The owner supplied the official transparent Zeke logo artwork and approved all reasonable placement decisions. The source was cropped losslessly into `public/images/zeke-logo-white.png` and `public/images/zeke-logo-mark.png`; the original Downloads file was not changed.
- Added `components/ui/BrandLogo.tsx` and replaced the typed wordmarks in the marketing navigation, dashboard navigation, auth shell, footer, and homepage story card. The improvised inline SVG favicon was replaced with the official mark.
- Homepage polish in the same working set: simplified the hero from an analytics graph to a clear deal-progress card, renamed the example to `Brand Campaign`, removed the unwanted divider/overlay line, corrected CTA headline contrast, and applied four no-human product/social-UI background images to the approved cards.
- `next.config.ts` now sets `devIndicators: false`; this removes the development badge and its viewport guide line from local visual QA while framework errors continue to surface normally.
- Production `/register` returns 200 on both `zekesolution.com` and `www.zekesolution.com`. A controlled Supabase signup succeeded for `mufeedputhalath+zekeqa-20260809094042@gmail.com`: a new identity was created and email confirmation was required. This proves signup submission and the configured email-send path accept a non-team inbox alias.
- Historical note superseded on 2026-08-11: the password-reset flow now has a complete production delivery, cross-session verification, password-update, and sign-in proof. A real-inbox signup confirmation click remains separate.
- Durable product, Shield, brand, auth, and workflow decisions are also recorded in `MEMORY.md`. No secrets are stored there.
- Added `docs/EXTERNAL-MEETING-PROTOCOL.md` as the owner-requested standard for every Zeke interaction involving outsiders, including investment, collaborations, vendors, users, legal providers, media, and events. It includes authority limits, confidentiality tiers, meeting controls, category addenda, escalation triggers, an approval matrix, and a reusable record template.
- Published the complete production line directly to `origin/main` as a fast-forward. Product release commit `924d6b0` and all five earlier production-cutover commits are now on `main`; the unrelated untracked root `HANDOFF.md` remained excluded.
- Vercel production deployment `app-db4ku5ewx-mufeed-4343s-projects.vercel.app` completed Ready in 39 seconds. Live probes returned 200 for `/`, `/register`, both official logo assets, and the optimized WebP background; the live HTML contains `Brand Campaign` and the official logo reference.
- Final verification passed: TypeScript, ESLint, two clean Next.js 16.2.10 production builds with all 36 routes, desktop browser visual QA, Git diff checks, GitHub commit status, Vercel deployment status, live-domain asset checks, and the controlled Supabase signup.

### Vercel and DNS cutover: 2026-07-22

- Vercel production deployment `dpl_6EF3oC7ZRrVnRtfp5CHy1dkMwdnu` is Ready at `app-28ymqr83a-mufeed-4343s-projects.vercel.app` and aliased to `zekesolution.com`. It was built from the verified local tree on Next.js 16.2.10 and generated all 32 routes.
- Project `mufeed-4343s-projects/app` uses Framework Preset Next.js and Root Directory `zeke-next`. The prior production deployment predated that root configuration and still served the retired root `index.html`; the 2026-07-22 deployment replaced it.
- `zekesolution.com` resolves to Vercel `76.76.21.21`; `www.zekesolution.com` is a CNAME to `cname.vercel-dns-0.com`. Both are attached as aliases to the new deployment.
- Cache-bypassed HTTPS probes returned 200 from both domains with the new Next.js hero and `/_next/static/` assets, not the legacy HTML. `/login` and creator registration return 200; anonymous `/creator` returns 307 to `/login`.
- Vercel Production now contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL=https://zekesolution.com`. The first CLI upload accidentally prefixed the values with a UTF-8 BOM and broke login; all three were replaced with raw BOM-free values and authenticated production login now passes. `SUPABASE_SERVICE_ROLE_KEY` was intentionally not added because the admin client helper is unused by application code.
- Production migrations 0001-0003 were applied successfully to Supabase on 2026-07-22. Authenticated creator/brand/admin production QA is complete. Password recovery gained a full production proof on 2026-08-11; only the separate real-inbox signup-confirmation callback remains manual.

### Authenticated production QA: 2026-07-22

- Final live run against `https://zekesolution.com` passed every creator, brand, and admin assertion with no material browser console/page errors. Temporary QA users, deals, campaigns, messages, submissions, files, payments, agreements, disputes, notifications, and Shield records were removed successfully after the run.
- Verified: cross-role dashboard guards; cross-role profile visibility; protection against role/Shield self-promotion and invalid deal-state jumps; campaign create/close; direct offers; accept/decline; two-way chat; private content upload/download and review; final-link submission; payment send/confirmation; Shield request/activation and agreement PDF authorization; dispute creation/resolution/status restoration; both cancellation directions; and admin user/deal visibility.
- QA found and fixed a missing brand-side cancellation control. Brands can now initiate, accept, or decline cancellation requests from the deal's Cancel tab; the creator side completed the reciprocal live test.
- QA also found React hydration warnings on relative "Joined" timestamps in the admin directory. The timestamp text is now explicitly marked as hydration-variant, and the final production browser run is clean.
- Password-reset and signup-confirmation email delivery/callbacks still require a manual inbox test and Supabase redirect allowlist review before public launch; password authentication itself passed for all three roles.

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
5. DONE (2026-07-22): authenticated creator, brand, and admin end-to-end production QA passed with a clean browser console; all temporary QA data was removed.
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

## Remaining manual launch QA

1. Complete a real-inbox signup confirmation through `/auth/callback`.
2. Password recovery is no longer pending: its production email, cross-session token verification, password update, and new-password login passed on 2026-08-11.
3. Production Site URL and redirect entries were verified for the apex, `www`, localhost callback, and `/auth/confirm` routes.

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
