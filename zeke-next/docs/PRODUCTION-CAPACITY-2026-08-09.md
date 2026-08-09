# Production capacity and performance - 2026-08-09

## Verified live setup

- Supabase organization plan: Free.
- Supabase project: `fslthsbjtgmdbabwcubs`, healthy, Tokyo (`ap-northeast-1`).
- Current Auth population: 3 users. `mufeed@zekesolution.com` is confirmed and its profile role is `admin`.
- Current Postgres database size: 13 MB against the Free plan's 500 MB database quota.
- Vercel team plan: Hobby. The project previously used the default Washington, D.C. function region. `vercel.json` now selects Singapore (`sin1`) so dynamic pages run much closer to the Tokyo database.
- Supabase Auth custom SMTP: Resend at `smtp.resend.com`, sending from `no-reply@zekesolution.com` as `Zeke`.
- Email confirmation is required. The live project Auth limit is 30 email sends per hour and 30 OTP sends per hour.
- CAPTCHA is not enabled.
- The Resend account's billing plan was not available through the local project configuration. If it is Resend Free, the provider limit is 3,000 emails per month and 100 per day.

## What Auth emails contain

Zeke does not email passwords. Registration calls Supabase `signUp` with the password entered by the user and Supabase sends a confirmation link. Password recovery sends a recovery link and asks the user to choose a new password after returning to Zeke.

A syntactically valid but nonexistent mailbox can be submitted because neither Zeke nor Supabase can prove mailbox existence synchronously. SMTP may accept the message first and report a bounce later. This behavior also avoids revealing whether a specific address already owns an account.

Recommended protection:

1. Enable CAPTCHA in Supabase Auth and add the matching registration widget.
2. Add a Resend webhook for delivered, bounced, and complained events.
3. Periodically remove old, never-confirmed identities after an agreed retention period.
4. Keep email confirmation required and do not expose account-existence checks.

## Current platform limits

### Supabase Free

- Total registered users: unlimited.
- Included monthly active users: 50,000.
- Database: 500 MB before Free-plan read-only restrictions.
- File storage: 1 GB.
- Maximum file upload size: 50 MB. Zeke validation now matches this live ceiling.
- Egress: 5 GB plus 5 GB cached egress.
- Realtime: 2 million messages per month, 200 peak concurrent connections, and 100 messages per second.
- Free projects can pause after one week of inactivity.

The binding Zeke limits are not the 50,000 MAU allowance. They are creator-file storage, 200 simultaneous Realtime connections, email throughput, lack of production backups, and the Free project pause/fair-use behavior.

At 50 MB per submission, 1 GB holds only about 20 maximum-sized files. At a more typical 10 MB per submission, it holds about 100 files. Upgrade Supabase before accepting real creator video at meaningful volume.

### Vercel Hobby

- Function invocations: 1 million per rolling usage period.
- Active CPU: 4 hours.
- Provisioned memory: 360 GB-hours.
- Fast data transfer: 100 GB.
- Image optimization source images: 1,000.
- Concurrent builds: 1.
- Function region: one selectable region on Hobby.

Vercel states that Hobby is for personal, non-commercial use. Zeke is a commercial product, so Pro is required for a proper production launch even before a technical quota is reached.

## Practical user capacity

- Registered accounts: there is no fixed Supabase total-user ceiling.
- Monthly active accounts: 50,000 are included on Supabase Free.
- Simultaneously online dashboards: plan around 200 or fewer while Realtime is active. A single browser connection can multiplex chat and notification channels, so this is approximately 200 concurrently connected users, not 200 total accounts.
- New email-confirmed signups at peak: no more than 30 Auth emails per hour under the current project setting, and possibly no more than 100 emails per day if the Resend account is Free.
- Conservative current operating target: 1,000 to 3,000 MAU, provided files are kept small and concurrency is monitored. This is an engineering planning estimate, not a vendor hard limit.
- At roughly 100 dynamic page/action requests per active user per month, Vercel's 1 million function-invocation allowance corresponds to about 10,000 MAU. Real usage must be measured before relying on that figure.

Recommended launch baseline:

1. Vercel Pro for commercial eligibility and scalable paid usage.
2. Supabase Pro for 100,000 included MAU, 8 GB disk, 100 GB file storage, 250 GB egress, daily backups, no inactivity pausing, and paid overage options.
3. Confirm the Resend plan and upgrade if launch volume can exceed 100 emails per day.
4. Enable CAPTCHA before a public signup campaign.
5. Add usage alerts for Auth emails, Storage, Realtime connections/messages, Vercel invocations, and transfer.

## Performance measurement and work

Pre-change live mobile Lighthouse result:

- Performance score: 70.
- First Contentful Paint: 2.1 seconds.
- Largest Contentful Paint: 3.4 seconds.
- Total Blocking Time: 770 milliseconds.
- Cumulative Layout Shift: 0.
- Root server response: about 40 milliseconds.
- Total page transfer: about 550 KiB.
- Main-thread work: 5.3 seconds.
- JavaScript execution: 1.4 seconds.
- Estimated unused JavaScript saving: 29 KiB.
- Estimated image saving: 28 KiB.

The server and transfer size are already healthy. The main problem is browser rendering work on the long homepage. This release adds `content-visibility: auto` to below-the-fold marketing sections and moves dynamic Vercel execution from Washington, D.C. to Singapore near the Tokyo database.

Next performance work, in order:

1. Re-run mobile Lighthouse after the new Vercel deployment and compare TBT/LCP.
2. Remove the small homepage navigation client boundary by using a no-JavaScript mobile disclosure if the audit still shows unnecessary hydration.
3. Resize and recompress the four CSS background images if the remaining 28 KiB image saving is confirmed.
4. Measure creator, brand, and admin routes with authenticated traces. Parallelize independent Supabase queries on any slow route.
5. Before larger launch scale, move Supabase to Singapore or Mumbai through a new-project migration so database, compute, and users are regionally aligned.

## Remediation verified in this release

- Realtime now publishes `deal_messages` and `notifications`.
- Whitespace-only and over-4,000-character messages are blocked by the database.
- Final-link submission atomically alerts the brand.
- Payment confirmation atomically alerts the brand.
- Live self-cleaning production QA passed 8 of 8 targeted checks.
- A cancelled deal no longer leaves stale Accept/Decline cancellation controls on the brand overview.
- The production build, TypeScript, ESLint, migration ledger, and linked database lint all pass.
