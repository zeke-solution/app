# Zeke project memory

Last updated: 2026-08-13

## Approved brand tagline

- Committee-approved wording: **Create. Collaborate. Get paid.**
- Preserve the exact wording, capitalization and punctuation in the marketing hero, marketing footer, default title, search/social metadata, manifest, and organization slogan.
- Do not use the rejected alternative “Deal safe, get paid.” without new committee approval.
- The preferred site title is `Zeke | Create. Collaborate. Get paid.` and the canonical production origin is `https://zekesolution.com`.

## Source of truth

- The active product is the Next.js app in `C:\Users\SEO EXECUTIVE\Desktop\app\zeke-next`.
- The Git repository root is `C:\Users\SEO EXECUTIVE\Desktop\app` and the remote is `https://github.com/zeke-solution/app`.
- `zeke-next/HANDOFF.md` is the canonical continuation note. The untracked `HANDOFF.md` at the repository root is stale and must not be staged.
- Production deploys from `main` to Vercel and uses Supabase project `fslthsbjtgmdbabwcubs`.
- For a direct Vercel production deploy, run from the repository root and pass local config zeke-next/vercel.json. Deploying from inside zeke-next conflicts with the project Root Directory; deploying from root without the local config can fall back to iad1 instead of required sin1.
- Never put passwords, API keys, tokens, or full environment values in source control or handoff files.

## Technical QA follow-up

- Brand workspace navigation invariant: keep five user-level destinations—Overview, Campaigns, Creators, Partnerships, Account. Chats and Deals are workflow internals, not separate list destinations; keep their list URLs redirecting to Partnerships and keep dynamic record URLs compatible.
- Brand Overview is an action queue before it is a reporting surface. Treat negotiating offers, submitted content, final links awaiting payment, creator cancellation requests, and disputes as Needs attention; derive the label and deep link through `lib/domain/brand-workflow.ts` so Overview and Partnerships cannot drift.
- One prominent next action belongs on each Brand partnership row. Normal workflow actions are primary; cancellation and disputes stay separated under Partnership options/problem controls. Deal tabs are conditional on actual submissions, final links, payments, and agreements instead of exposing empty equal-weight tabs.
- `/brand/campaigns?new=1` must open the composer directly, including navigation while already on Campaigns. Keep `CampaignsPageClient` keyed from the server query state; do not restore a synchronous state-setting effect. Recipient rows remain collapsed by default.
- Negotiating offer editing belongs directly in Brand Chat and continues to use the validated `editOffer` action. Every workflow mutation must revalidate `/brand/overview` and `/brand/partnerships` so the attention queue stays current.
- Mobile Brand navigation must retain Creators and Work. Partnership filters must wrap rather than escape the 320 px viewport. Creator search is debounced 250 ms and the server result is capped at 100 until real pagination is implemented.
- The 2026-08-12 populated Brand QA passed 39 route/viewport combinations at 320, 768, and 1440 px plus attention, direct-composer, negotiation-editor, status-deep-link, and compatibility-redirect assertions. There were zero overflows/browser errors and zero QA accounts after cleanup.

- Admin coverage invariant: the Admin role has complete operational read access, not access to passwords, API keys, provider secrets, or raw project secrets. Keep `/admin/system` explicitly protected with `requireRole("admin")`; use the server-only Admin client only for Auth metadata, Storage inventory, and signed file access that cannot be obtained from public-table RLS.
- Keep the standard Admin destinations: global Campaigns, paginated Platform Records, System/identity inventory, and the mobile All Admin Tools directory. Platform Records owns messages, notifications, submissions, agreements, payments, final links, and guardians.
- Queue pages must not erase history by filtering it away. Shield Requests and Disputes default to all records and provide status filters. Activated/rejected Shield requests and resolved disputes are read-only; only pending/open records retain their existing destructive controls.
- Admin agreement downloads intentionally bypass the participant Shield-membership gate after Admin identity is verified. Participant downloads retain the active-Shield requirement.
- The 2026-08-12 live baseline contained 2 campaigns, 27 messages, 3 agreements, 12 notifications, 9 Auth users, 1 activated Shield request, and 12 removal-audit entries. Authenticated Admin QA passed 72 route/viewport combinations plus a real agreement-PDF access proof; the temporary account was removed.

- Dashboard fit invariant: below 768 px use the mobile bottom navigation; from 768 px through 1023 px keep the 72 px icon rail; at 1024 px and above expand to the 240 px sidebar. Do not restore the full sidebar at 768 px because it leaves only 528 px for dashboard content while data grids are already in their wider layouts.
- Dashboard overview grids and their direct sections must remain `min-w-0`; otherwise populated Admin deal rows can force a single-column grid 30 px beyond the usable 320 px mobile content slot while page-level clipping hides the defect.
- The mobile notification list must remain fixed to `inset-x-3` below 640 px. Its anchored `w-80` form belongs at `sm` and above only.
- The 2026-08-12 authenticated fit matrix passed 92 combinations across 23 dashboard routes and four viewports (320, 768, 1024, and 1440 px wide), plus open notification panels for creator, brand, and admin. Temporary QA accounts were removed.

- Release 1 is live from main commit `7beff82`; Vercel completed successfully and production smoke/header checks pass. Migration 0021 is live and the remote migration ledger is up to date.
- Admin removals use a database-transactional operation ledger, with external Auth/Storage cleanup explicitly retryable from Admin > Removal log. Do not bypass this path with direct table-by-table deletion.
- Keep the central response headers and powered-by opt-out in next.config.ts. The intentionally limited CSP protects object/base/form/frame behavior without forcing every static page into nonce-based dynamic rendering.
- Keep AuthShell as the authentication main landmark, preserve one h1 per repaired auth/public page, let TextField generate stable label IDs, and keep password reveal controls at least 24 x 24 px.
- Performance needs a controlled live trace rather than asset guessing. Three current live mobile Lighthouse samples have median Performance 84 and median TBT about 466 ms despite unchanged ~303 KiB transfer; local mobile is 93 with 60 ms TBT.
- SEO baseline is live from commit `de1be05` (2026-08-13): apex canonical plus permanent www redirect, unique public-page metadata, square favicon/logo assets, social preview image, WebSite/Organization/ProfilePage JSON-LD, private-route noindex metadata, and robots/sitemap/manifest endpoints. Next manual step: submit `https://zekesolution.com/sitemap.xml` and request homepage recrawling in Google Search Console.
- Legal-provider URLs are HTTP(S)-only. Payment-proof is limited to 20 MB PDF/images and agreements to 10 MB PDF at the bucket boundary.
- Add automated app tests and expand database coverage through migration 0021 before relying on the old 0001-0003/0010-0011 shim as full coverage.

## Open core workflow findings

- Highest priority after Release 1 is moving offer acceptance and decline into locking database RPCs. The current action changes deal status, then writes the agreement, event message, and notification separately without checking every result.
- Offer acceptance also needs optimistic concurrency: validate the amount or `updated_at` value the creator actually saw so an edited negotiating offer cannot be accepted under silently changed terms.
- Fix Shield dispute classification together: `raise_dispute_transaction` must check the deal creator's active, unexpired membership rather than checking only the actor's `shield_active` flag.
- Submission revision status and multiple simultaneously pending submissions need a product decision before changing the state model. Full evidence and lower-priority findings are recorded in the 2026-08-11 static-review section of HANDOFF.md.

## Google authentication

- Google sign-in is additive to Supabase Auth. Keep email/password enabled and keep Resend sending branded Auth email from `no-reply@zekesolution.com`; do not replace transactional SMTP with Gmail.
- Never expose the Google client secret to Next.js or a `NEXT_PUBLIC_` variable. Save it only in the Google/Supabase provider configuration.
- Activation order is mandatory: apply migration 0019, configure Google and Supabase callback settings, test the provider, then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and redeploy.
- A new OAuth user without Zeke role metadata must remain `profiles.role='pending'` with `onboarding_completed=false` and no role-specific row. Dashboard guards must reject pending profiles.
- `/onboarding` reuses the complete role form. Only the authenticated `complete_google_onboarding` RPC may move a Google identity from pending to Creator or Brand, and it must create the subtype atomically. OAuth can never select admin.
- Existing matching-email users retain their current Zeke role/profile through Supabase identity linking; onboarding must never overwrite a completed profile.
- Production migration 0019 is live and linked database lint is clean. Google remains disabled in production and the feature flag is unset until the client ID/secret are configured and real-account acceptance passes.
- Setup and acceptance procedure: `docs/GOOGLE-AUTH-SETUP.md`.

## Dashboard app-interface system

- Treat creator, brand, and admin areas as workspaces, not marketing pages. Keep the dark 240 px desktop sidebar and app bar, the light signed-in canvas, and a content width up to 1280 px with 16 px mobile, 24 px tablet, and 32 px large-desktop padding.
- Use `components/layout/PageHeader.tsx` for top-level signed-in page title, purpose copy, counts, and primary actions. Use `SectionHeader` for major content groups so actions and hierarchy stay predictable.
- Keep signed-in surfaces quiet and functional: white cards, 12 px radii, minimal shadow, restrained semantic badges, 14 px base copy, 13 px compact labels, and 12 px metadata. The formal agreement document is exempt from typography scaling.
- The borderless refinement is site-wide, not dashboard-only. Marketing, public, auth, recovery, creator, brand, and admin cards, boxes, tables, rows, dividers, badges, headers, footers, and navigation shells use color contrast, spacing, and restrained elevation instead of decorative outline lines. Keep input fields, selects, textareas, ordinary action buttons, compact action links, focus states, selectable controls, and destructive controls visibly bounded.
- KPI cards use label, icon, then value. Desktop data collections use visible aligned column headers and rows; narrow screens use labelled field cards. Do not reintroduce unexplained compact value columns on mobile.
- Overview pages should use the available desktop width for balanced work groups rather than stacking every card in one narrow vertical feed. Filters belong in a bordered toolbar and counts/actions belong in the page header.
- Preserve the standard mobile bottom navigation and standard Next.js navigation. The directional/swipe page-transition experiment was removed after owner feedback and must not return without a new explicit request.
- The interface normalization changes presentation only. Do not couple visual cleanup to Supabase queries, RLS, role routing, deal state, or transaction workflow changes.

## Performance and dashboard navigation release

- Feature commit `f88f1f6` is on `main`. Vercel Production deployment `5833234962` succeeded, both custom domains return HTTP 200, anonymous role overviews redirect to `/login`, and the 31-day public image cache header is live.
- Use `next/font/local` for the installed Latin Inter and Sora variable WOFF2 files. Keep static logo imports and truthful `sizes`; the old 2,853 px intrinsic full-logo declaration caused a much larger image request than the 82-112 px display slots needed.
- Stable public image caching is 31 days. Mobile marketing cards intentionally use lightweight gradient equivalents; desktop keeps the image artwork.
- Keep the marketing top navigation server-rendered. Hydrate only `MobileMenu`. Keep dashboard Realtime notifications deferred until idle, including the panel's existing catch-up query once loaded.
- Protected server checks use Supabase `getClaims()`. The project has an asymmetric ES256 signing key, allowing cached-JWKS verification. Do not remove the subsequent RLS-protected profile and role query: claims establish identity, while the database remains the authorization source.
- Dashboard page-transition animation was removed after production feedback that it did not feel right. Keep standard Next.js navigation and do not re-add directional or touch-drag navigation without a new explicit product request.
- On narrow dashboards, present compact values as labelled field grids. Current labelled rows cover deals, creators, admin deal listings, user directories, and entity-detail tiles.
- Candidate five-run mobile median: Performance 96, FCP 913 ms, LCP 2.818 s, Speed Index 913 ms, TBT 45 ms, and transfer 304.7 KiB. Controlled transfer fell 65.4 KiB or 17.7%. Final desktop Performance is 100; Accessibility, Best Practices, and SEO are all 100.
- Full method, run table, verification, and known limits: `docs/PERFORMANCE-DASHBOARD-QA-2026-08-10.md`.

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

- Production service state verified 2026-08-09: Supabase organization is Free; Vercel team is Hobby; Auth custom SMTP is Resend from `no-reply@zekesolution.com`; email confirmation is required; Auth email and OTP rate limits are both 30/hour; CAPTCHA is off.
- `mufeed@zekesolution.com` is the permanent confirmed admin account. Its profile role is `admin`. Password setup uses a one-time recovery link so no operator ever knows or sends the chosen password.
- Auth emails contain confirmation or recovery links, never passwords. A syntactically valid nonexistent mailbox can be accepted initially and later bounce; use CAPTCHA, provider bounce webhooks, and cleanup of stale unconfirmed identities rather than exposing mailbox/account existence.
- Password-reset success copy must remain account-neutral: say that a link will arrive only if an account exists. Show the exact submitted address and a correction action so typos are visible, but never reveal whether an email is registered.
- Supabase email-password signup creates the auth identity, creates the role profile through the database trigger, and sends a confirmation link through the configured custom email path.
- Google OAuth continues through `/auth/callback`. Email-password signup uses the token-hash flow at `/auth/confirm-signup`, while password recovery uses its separate token-hash flow at `/auth/confirm` and redirects to `/update-password` only after a successful server-side `verifyOtp` call.
- Do not restore PKCE-code confirmation or recovery for email links. Its verifier is stored on the requesting browser, so a desktop request can fail when the email is opened on mobile or in an in-app browser. Both email flows must remain device-independent token-hash routes.
- Keep the explicit Continue POST between each email link and token verification. GET must not consume a one-time confirmation or recovery token because email scanners and link previews may follow links automatically.
- The hosted Supabase confirmation template must use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}` and redirect to `/auth/confirm-signup`; keep apex, `www`, and localhost variants allowlisted. The server fixes signup verification to `type: email` and must never trust a token type supplied by the browser.
- Old reset emails may use the retired callback and remain invalid. Acceptance testing must request exactly one fresh email after the current template is live and use only its newest link.
- A controlled signup on 2026-08-08 succeeded for the Gmail alias `mufeedputhalath+zekeqa-20260809094042@gmail.com`; Supabase created a new identity and required email confirmation.
- Cross-device signup confirmation passed a controlled production proof on 2026-08-14: a fresh session loaded the first-party link without consuming it, the explicit form POST confirmed the identity, Supabase session cookies were created, and the brand landed on `/brand`. The disposable Auth user and profile were removed. Application commit `02ce10c` and the hosted Supabase template/config are live.
- Password recovery passed a full production proof on 2026-08-11: Resend delivered the branded template, a separate session verified its token, the password updated, and the new password signed in. Commit `236aced` subsequently simplified new recovery links to the single `token_hash` parameter; the route fixes `type: recovery` server-side and Supabase still verifies the one-time token. The hosted template matches. The owner confirmed a fresh correct-account link works on mobile and identified the reported repeat failure as a wrong submitted email. Previously delivered emails cannot adopt a new template, so always use only the newest link.
- Required production variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and server-only `RESEND_API_KEY`. The public Supabase variable uses a publishable key. The Supabase secret and Resend key must never enter client code, browser responses, logs, or documentation. Legacy anon/service API keys were disabled on 2026-08-11 after the replacement keys passed production checks; stale tabs from before that deployment may need one refresh.

## Campaign invitation email

- `sendCampaignOffers` is the single invitation path for both the Campaigns sender and Discover's existing-campaign picker. Email only the `deals` rows returned by a successful insert; skipped duplicates, rejected input, and failed inserts must never email.
- Preserve the order of truth: create the deal, event message, and in-app notification first, then attempt email. In-app offers remain authoritative if email transport fails; do not retry the entire action and risk duplicate campaign records because an optional notification failed.
- `lib/email/campaign-invitation.ts` uses Resend's batch endpoint for at most 100 personalized messages, matching `sendCampaignOffersSchema`. Keep the sender `Zeke <no-reply@zekesolution.com>` and link recipients to `/creator/offers` on `NEXT_PUBLIC_SITE_URL`.
- Creator email addresses come from Supabase Auth through the server-only admin client. Never select, return, cache in client state, or log those addresses. Logs may include only provider status and aggregate invitation counts.
- Every invitation email must include the brand, campaign, platform, fee, deadline, review action, and a clear statement that the email itself does not accept the campaign.

## Admin master removal controls

- Admin can permanently remove non-admin users, campaigns, deals, disputes, Shield requests, Shield cases, and legal providers from their relevant admin surfaces. Keep administrator accounts protected from this UI.
- Every removal requires exact typed confirmation `REMOVE`. Preserve the warning copy, disabled-until-matched destructive button, and server-side admin-role check.
- `actions/admin-removal.ts` is the single orchestration point. It uses the server-only Supabase secret to clean dependent rows and known Storage objects, then writes `admin_removal_audit` and revalidates affected workspaces.
- `admin_removal_audit` from migration 0020 is append-only to authenticated application users: admins can read it at `/admin/removals`, while only the service role can insert. Do not add edit or delete controls to the log.
- No real deletion was executed during release QA. The browser test typed `REMOVE` only to check enablement, then chose Keep it; its temporary admin was removed directly during test cleanup.

## Dashboard contrast and media upload release

- Profile avatars are saved through `set_profile_avatar`, not a direct `profiles.avatar_url` update grant. Keep the RPC narrow: authenticate, validate the caller-owned Storage path and official public URL, confirm the object exists, then update only the caller's profile.
- Migration 0014 fixes the missing avatar save permission without broadening authenticated table privileges. Migration 0015 explicitly revokes anon execute because Supabase function defaults can grant `anon` separately from `PUBLIC`.
- When an avatar save fails, remove a newly orphaned object if it is not the previously referenced path. After a successful extension change, remove the replaced old object.

- Keep the public marketing `.brand-card` treatment dark, but always override `.dashboard-content .brand-card` to the signed-in white surface. A dark marketing gradient combined with dashboard dark text is the confirmed source of unreadable blue stat cards.
- On signed-in screens, use 14 px base copy, 13 px compact labels, a 12 px minimum for metadata, and 16 px mobile form controls. Keep the official agreement preview exempt from global scaling.
- Auth mobile follows its own shared fit rule: use 100dvh, compact card padding, 16 px inputs, 14 px page subtitles, smaller muted helper copy, normal word boundaries, and no horizontal page movement. Below 360 px, paired creator-platform fields stack to one column. Exact 390 px and 320 px QA passed for Login and both Sign-up steps on 2026-08-10.
- Signed-in content must stay at the viewport width, wrap long user content, and avoid horizontal page scrolling. Mobile overlays are full-height `100dvh` sheets; desktop overlays remain centered cards.
- The 2026-08-10 exact 390 x 844 browser QA measured document width equal to viewport width, visually passed representative dashboard cards and controls, and reconfirmed every semantic dashboard color at WCAG AA or better.
- Current mobile-readability release: feature commit `fb122d3`, Vercel Production Ready, both production aliases active, functions in `sin1`.

- In signed-in pages, use semantic `text-light`, `text-muted`, and dashboard-local tokens for normal content. Reserve `text-white` for genuinely dark or filled surfaces. Never restore a blanket `.dashboard-content .text-white` override.
- Normal dashboard text colors must keep at least 4.5:1 contrast on white.
- Submission content supports JPG, PNG, WebP, HEIC, HEIF, MP4, and MOV. Small file sizes keep three-decimal precision. Uploads use resumable TUS with 6 MB chunks, retry, and progress.
- App and bucket limits are 100 MB, but Supabase Free still caps the project's global Storage limit at 50 MB. Upgrade and set global Storage to at least 100 MB before describing 50-100 MB uploads as active.
- Mobile overlays are full-height `100dvh` sheets with safe-area padding and internal scrolling. Desktop overlays stay centered.
- Production migrations are live through 0021. The current application baseline is Next.js 16.3.0. The final dependency audit is clean.

## Campaign workspace, mobile chat, and shared avatar rules

- Brand Campaigns is the management source for published reusable briefs and every creator recipient. Discover must select one of the brand's existing active campaigns; do not restore a second custom-campaign form there.
- `sendCampaignOffers` must verify brand ownership and active status, skip recipients with an existing non-cancelled offer for that campaign, and keep the partial unique database index as the race-safe final duplicate guard.
- Keep navigation status-aware: a negotiating campaign opens Chat; an accepted workflow record opens Deals. The Deals list itself remains accepted-only.
- Campaign briefs persist platform, objective, deliverables, creator requirements, usage rights, exclusivity, payment terms, fee, and deadline. Bulk offers must inherit the applicable saved terms rather than reconstructing them from one free-text description.
- Brand Campaigns presents each brief as the parent record with an aggregate invitation summary and every invited creator underneath it. Desktop creator rows use aligned Creator, Status, Fee, Invited, and Action columns; mobile uses labelled creator cards. Each row opens Chat while negotiating and Deal after the workflow advances.
- Do not label a negotiating campaign recipient as awaiting response: that state also covers active negotiation messages, so the truthful label is Negotiating.
- Signed-in chat pages reserve the visible workspace with `100dvh`. The message pane is the internal scroller. On mobile, the composer is fixed directly above the 64 px safe-area-aware bottom navigation; on desktop it returns to normal flow.
- Exact mobile QA on 2026-08-10 measured the composer at y=713-780 and navigation at y=780-844 in a 390 x 844 viewport. They touch without a gap or overlap, and document width remains 390.
- Creator cards and brand-facing campaign, chat, and deal surfaces must request and render `profiles.avatar_url` through `ProfileAvatar`, with initials only as fallback.
- Replacement avatars reuse the owner-only Storage object path but save a versioned public URL through `set_profile_avatar`. Keep migration 0017's URL validation and anonymous execute denial so cache busting does not broaden mutation access. Migration 0018 backfills a version token only for existing official Supabase avatar URLs that did not already have one.

## Deal safety, notifications, and dashboard performance

- Migration 0011 was applied and live-tested on 2026-08-09. `deal_messages` and `notifications` are now in the Realtime publication; database constraints reject blank or over-4,000-character chat; final-link and payment-confirmation RPCs now alert the brand atomically. The targeted production retest passed 8/8.
- Cancellation UI rule: Accept/Decline controls are shown only while a request is actionable. Never show them when status is `completed`, `cancelled`, or `disputed`, even though `cancel_requested_by` is intentionally retained as history after acceptance.
- Deals navigation rule: negotiating records belong in Chats and the creator Offers inbox, not either party's Deals list. Only accepted workflow records enter Deals. Direct brand or creator deal-detail requests must redirect negotiating parties to the matching Chat.
- Agreement presentation rule: the in-app record and downloadable PDF must share the official Zeke letterhead pattern with the current logo, navy header, purple-magenta accent, stable ZK-AG reference, parties, accepted terms, digital acceptance state, record notice, and footer. Do not revert to a generic text PDF or dark summary card.
- Performance baseline before the 2026-08-09 speed change was mobile Lighthouse 70, LCP 3.4s, TBT 770ms, zero CLS, 40ms root response, and 550 KiB transfer. Below-fold marketing sections are deferred with `content-visibility`, and Vercel functions target Singapore near the Tokyo Supabase project.
- Post-deployment Lighthouse remained 70 but main-thread work improved from 5.3s to 3.6s, JavaScript execution from 1.4s to 1.1s, TBT from 770ms to 640ms, and transfer from 550 KiB to 417 KiB. The next speed target is eliminating unnecessary homepage hydration and rechecking LCP.
- `SUBMISSION_MAX_SIZE_MB` and the `submissions` bucket are 100 MB, but Supabase Free still enforces a 50 MB global Storage ceiling. Upgrade to Pro or higher and set global Storage to at least 100 MB before files above 50 MB can succeed.
- A deal with an open or escalated dispute must not transition to `completed` or `cancelled`. Migration `0010_active_dispute_close_guard.sql` enforces this invariant in the database, including the edge case where a cancellation was requested before the dispute opened.
- Migration 0010 was applied to the linked production Supabase project on 2026-08-09. The application also blocks cancellation acceptance and decline while a deal is disputed, and both role views explain that the dispute must be resolved first.
- `NotificationsPanel` uses the signed-in user's filtered Supabase Realtime insert stream to show up to three in-app popup cards. Popups auto-dismiss after seven seconds, can be closed, mark the notification read when opened, and link to the related deal when one exists.
- Current popups work while Zeke is open and the user is signed in. Browser or operating-system push while Zeke is closed is a separate phase requiring notification permission, a service worker, stored push subscriptions, and a server-side delivery path.
- Dashboard responsiveness improvements include one shared browser Supabase client, direct Realtime payload updates without a second notification query, route loading skeletons for creator, brand, and admin areas, and Next.js `Link` navigation for the brand campaign action.
- Treat performance as measured work. These changes remove identified sources of perceived lag, but any remaining lag should be reproduced on the specific route and action before further optimisation.
- The dispute, in-app notification popup, and dashboard responsiveness release is live from main feature commit fac490f; Vercel completed successfully and the production homepage and login route returned 200.

## Production data reset

- Latest production reset on 2026-08-10 supersedes the historical snapshots below. Current retained state: 6 Auth users, 6 profiles, 4 creator profiles, 1 brand profile, and 1 admin profile. All identities are confirmed and role rows are complete.
- The reset reached zero transactional rows. As of the final 2026-08-10 audit, production later contains one active campaign (`Curios`) and two negotiating deals (`Test` and `Curios`). They were not created by responsive QA and must not be deleted without a new instruction.
- All 6 profiles remain, including Fida Sherin. All 4 creator Shield flags are false and every Shield expiry is null.
- Preserve creator/brand profile fields and avatar objects when the owner asks for a profile-preserving fresh slate. If the owner separately asks to remove Shield from everyone, clear only `shield_active` and `shield_expires`.
- On 2026-08-09 the owner requested a production fresh slate. The reset retained exactly two confirmed login accounts and their required role records: one creator and one brand.
- All other authentication accounts and all rows in campaigns, deals, messages, submissions, final links, payments, agreements, disputes, notifications, Shield requests/cases/updates/documents, guardians, and legal providers were deleted. The single uploaded QA file was removed through the Supabase Storage API.
- Post-reset audit: 2 auth users, 2 profiles, 1 influencer profile, 1 brand profile, zero rows in every transactional table, and zero storage objects.
- There is currently no admin-role profile. `/admin` cannot be accessed until the owner explicitly chooses an account to promote or creates a separate admin account. Do not silently change either retained account's role.
## Ten-deal production stress test

- On 2026-08-09, live run `QA-20260809113327` created and exercised 10 deliberately problematic deals using the retained creator and brand accounts. The deals remain in production for dashboard inspection. Full evidence is in `docs/QA-PROBLEM-DEALS-2026-08-09.md`.
- 216 of 218 checks passed. Duplicate offers, immutable accepted terms, private chat membership, rejection/resubmission, final-link validation, underpayment, payment mismatch, double-payment concurrency, reciprocal cancellation, active-dispute close prevention, dispute escalation/resolution, monthly Shield activation, consent controls, provider verification, evidence, and outcome requirements behaved correctly.
- Production `supabase_realtime` currently publishes zero public tables. As a result, live chat fan-out and notification popups do not receive inserts even though the client subscriptions exist. This requires a reviewed migration for `public.deal_messages` and `public.notifications`, followed by a live event retest.
- Direct authenticated PostgREST can insert whitespace-only chat. The Server Action blocks it, but the database needs a matching non-blank and 4,000-character defense-in-depth constraint.
- Final-link submission still does not notify the brand, and creator payment confirmation still does not notify the brand. Add both notifications inside their atomic transaction RPCs.
- The QA run left one escalated disputed deal, one resolved Shield case, an active one-month Shield membership, two clearly labelled QA legal providers, and six QA Storage objects. The temporary admin was removed; exactly two auth users and zero admin profiles remain.
## External representation

- `docs/EXTERNAL-MEETING-PROTOCOL.md` is the operating standard whenever an outsider is involved in a Zeke meeting, pitch, demo, negotiation, event, or informal business conversation.
- No representative may make an oral commitment on equity, investment, exclusivity, commission, pricing, legal outcomes, product delivery, data access, or settlement outside the written approval matrix.
- Use minimum-necessary disclosure, explicit recording or AI-transcription consent, documented conflicts, a named meeting owner, and a written follow-up record.
## Working conventions

- Read `AGENTS.md` and the relevant bundled Next.js 16 guide under `node_modules/next/dist/docs/` before changing framework behavior.
- Preserve unrelated work in a dirty tree. Stage only explicit intended paths, never the stale root handoff.
- Before publishing, run TypeScript, ESLint, a production build, targeted browser QA, and a remote/live verification appropriate to the change.
- Keep `devIndicators: false` in local config so the Next.js development badge and its viewport guide line do not obstruct visual review. Framework errors still surface normally.

## Mobile product and infrastructure follow-up

- Mobile words must wrap only at normal word boundaries. Never restore `overflow-wrap: anywhere` on dashboard labels, cards, links, or buttons.
- The marketing hero must not render the campaign-progress illustration at any viewport width. Keep the hero as one content column, keep Create account and Log in in the first mobile viewport, and keep the burger menu as a fixed overlay that does not push the page down.
- Sign out belongs at the desktop sidebar bottom and inside the mobile Profile or Account destination, not as a permanent top-right icon.
- Shield payment lives at `/creator/shield/payment`. `ZEKE_SHIELD_PAYMENT_URL` is the optional server-side HTTPS provider link. Until configured, collect no card details and offer only verified payment instructions plus payment-reviewed activation.
- Cloudflare is still not configured. Before broad launch, add the domain carefully around Vercel, SSL/TLS Full (strict), managed WAF rules, bot review, and rate limits for auth and write-heavy routes, then retest Auth callback URLs.
- Android APK packaging is possible. Prefer Capacitor after mobile-web acceptance so push notifications, deep links, uploads, and camera access can be integrated cleanly. Use a Trusted Web Activity only if the fastest thin web wrapper is more important than native control.
- Current responsive and campaign-first release: feature commit `8ec398e` on `main`, Vercel deployment `dpl_91nyAu2jmBcNCmfVPajf1ba7wPpz` Ready on both production domains, functions in `sin1`.
