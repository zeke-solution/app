# Zeke project memory

Last updated: 2026-08-10

## Source of truth

- The active product is the Next.js app in `C:\Users\SEO EXECUTIVE\Desktop\app\zeke-next`.
- The Git repository root is `C:\Users\SEO EXECUTIVE\Desktop\app` and the remote is `https://github.com/zeke-solution/app`.
- `zeke-next/HANDOFF.md` is the canonical continuation note. The untracked `HANDOFF.md` at the repository root is stale and must not be staged.
- Production deploys from `main` to Vercel and uses Supabase project `fslthsbjtgmdbabwcubs`.
- For a direct Vercel production deploy, run from the repository root and pass local config zeke-next/vercel.json. Deploying from inside zeke-next conflicts with the project Root Directory; deploying from root without the local config can fall back to iad1 instead of required sin1.
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

- Production service state verified 2026-08-09: Supabase organization is Free; Vercel team is Hobby; Auth custom SMTP is Resend from `no-reply@zekesolution.com`; email confirmation is required; Auth email and OTP rate limits are both 30/hour; CAPTCHA is off.
- `mufeed@zekesolution.com` is the permanent confirmed admin account. Its profile role is `admin`. Password setup uses a one-time recovery link so no operator ever knows or sends the chosen password.
- Auth emails contain confirmation or recovery links, never passwords. A syntactically valid nonexistent mailbox can be accepted initially and later bounce; use CAPTCHA, provider bounce webhooks, and cleanup of stale unconfirmed identities rather than exposing mailbox/account existence.
- Password-reset success copy must remain account-neutral: say that a link will arrive only if an account exists. Never reveal whether an email is registered.
- Supabase email-password signup creates the auth identity, creates the role profile through the database trigger, and sends a confirmation link through the configured custom email path.
- Signup uses `https://zekesolution.com/auth/callback?next=/login`; password reset uses the same callback with `next=/update-password`.
- A controlled signup on 2026-08-08 succeeded for the Gmail alias `mufeedputhalath+zekeqa-20260809094042@gmail.com`; Supabase created a new identity and required email confirmation.
- The remaining manual auth check is clicking the real inbox confirmation link and completing a password-reset email callback. Do not describe those callbacks as verified until they have been clicked successfully.
- Required production variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`. `SUPABASE_SERVICE_ROLE_KEY` is intentionally absent while no active application code needs it.

## Dashboard contrast and media upload release

- Profile avatars are saved through `set_profile_avatar`, not a direct `profiles.avatar_url` update grant. Keep the RPC narrow: authenticate, validate the caller-owned Storage path and official public URL, confirm the object exists, then update only the caller's profile.
- Migration 0014 fixes the missing avatar save permission without broadening authenticated table privileges. Migration 0015 explicitly revokes anon execute because Supabase function defaults can grant `anon` separately from `PUBLIC`.
- When an avatar save fails, remove a newly orphaned object if it is not the previously referenced path. After a successful extension change, remove the replaced old object.

- Keep the public marketing `.brand-card` treatment dark, but always override `.dashboard-content .brand-card` to the signed-in white surface. A dark marketing gradient combined with dashboard dark text is the confirmed source of unreadable blue stat cards.
- On signed-in mobile screens, use 14 px for normal reading, 13 px for secondary labels, 12 px only for compact metadata, and 16 px for form controls. Keep the official agreement preview exempt from global mobile scaling.
- Signed-in content must stay at the viewport width, wrap long user content, and avoid horizontal page scrolling. Mobile overlays are full-height `100dvh` sheets; desktop overlays remain centered cards.
- The 2026-08-10 exact 390 x 844 browser QA measured document width equal to viewport width, visually passed representative dashboard cards and controls, and reconfirmed every semantic dashboard color at WCAG AA or better.
- Current mobile-readability release: feature commit `fb122d3`, Vercel Production Ready, both production aliases active, functions in `sin1`.

- In signed-in pages, use semantic `text-light`, `text-muted`, and dashboard-local tokens for normal content. Reserve `text-white` for genuinely dark or filled surfaces. Never restore a blanket `.dashboard-content .text-white` override.
- Normal dashboard text colors must keep at least 4.5:1 contrast on white.
- Submission content supports JPG, PNG, WebP, HEIC, HEIF, MP4, and MOV. Small file sizes keep three-decimal precision. Uploads use resumable TUS with 6 MB chunks, retry, and progress.
- App and bucket limits are 100 MB, but Supabase Free still caps the project's global Storage limit at 50 MB. Upgrade and set global Storage to at least 100 MB before describing 50-100 MB uploads as active.
- Mobile overlays are full-height `100dvh` sheets with safe-area padding and internal scrolling. Desktop overlays stay centered.
- Production migrations are live through 0018. The current application baseline is Next.js 16.3.0 from the HEAD of `main`; Vercel Production is Ready. The final dependency audit is clean.

## Campaign workspace, mobile chat, and shared avatar rules

- Brand Campaigns is the management source for both published reusable briefs and one-to-one campaigns sent directly from Discover Creators. Do not send a successful direct offer to Deals while it is negotiating.
- Keep navigation status-aware: a negotiating campaign opens Chat; an accepted workflow record opens Deals. The Deals list itself remains accepted-only.
- Campaign briefs persist platform, objective, deliverables, creator requirements, usage rights, exclusivity, payment terms, fee, and deadline. Bulk offers must inherit the applicable saved terms rather than reconstructing them from one free-text description.
- Signed-in chat pages reserve the visible workspace with `100dvh`. The page header and completed-chat control are fixed-height siblings; the message pane is the internal scroller; the composer is the final flex item above mobile navigation. Preserve this structure so keyboard viewport changes do not hide the composer.
- Exact mobile QA on 2026-08-10 passed at 390 x 844 and keyboard-reduced 390 x 500. Document width matched viewport width, form controls stayed inside the screen, and the composer cleared the mobile nav by 8 px in both measurements.
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
- All campaign, deal, message, delivery, payment, agreement, dispute, notification, Shield case/request, guardian, and legal-provider records are zero. All non-avatar Storage objects are zero. One creator avatar remains.
- Preserve creator/brand profile fields and avatar objects when the owner asks for a profile-preserving fresh slate. Shield membership fields live on `influencer_profiles` and were deliberately retained as profile data.
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
