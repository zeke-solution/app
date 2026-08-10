# Performance and dashboard QA - 2026-08-10

## Release state

- Production baseline: commit `412af6a` on `origin/main`.
- This performance and dashboard-polish candidate is local and uncommitted.
- It has not been pushed or deployed.
- No production data, authentication account, migration, or external service was changed.

## Scope

- Reduce public-page transfer and render delay without removing desktop artwork.
- Reduce unnecessary hydration and defer dashboard Realtime notification code until idle.
- Avoid an Auth-server round trip on protected navigations while preserving signed-token verification and profile/RLS authorization.
- Add short swipe-like directional transitions between dashboard destinations.
- Make mobile deal, creator, and admin data rows read as labelled fields instead of compressed unexplained columns.
- Preserve normal fallback behavior in browsers without View Transitions and disable motion when the user requests reduced motion.

## Measurements

The live baseline and local candidate are not identical environments, so the controlled local before/candidate comparison is the main transfer evidence. Windows Lighthouse timing was visibly noisy; five candidate mobile runs were collected and medians are reported.

| Mobile trace | Performance | FCP | LCP | Speed Index | TBT | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Live production baseline | 96 | 1.6 s | 2.6 s | 2.8 s | 90 ms | 371 KiB |
| Controlled local before, one run | 83 | 1.704 s | 3.594 s | 6.792 s | 46 ms | 370.1 KiB |
| Candidate run 1 | 64 | 1.425 s | 4.142 s | 8.239 s | 558 ms | 304.7 KiB |
| Candidate run 2 | 88 | 1.514 s | 3.136 s | 3.970 s | 184 ms | 304.6 KiB |
| Candidate run 3 | 97 | 0.913 s | 2.671 s | 0.913 s | 42 ms | 304.8 KiB |
| Candidate run 4 | 96 | 0.911 s | 2.818 s | 0.911 s | 27 ms | 305.2 KiB |
| Candidate run 5 | 96 | 0.913 s | 2.784 s | 0.913 s | 45 ms | 304.4 KiB |
| Candidate five-run median | 96 | 0.913 s | 2.818 s | 0.913 s | 45 ms | 304.7 KiB |

The candidate transfers about 65.4 KiB less than the controlled local before trace, a 17.7% reduction. The stable audit-level changes are:

- The 41.9 KiB story texture is no longer requested on mobile; equivalent gradient styling remains.
- The displayed logo request fell from about 28.6 KiB to 4.5 KiB, about 84% smaller.
- Image delivery and cache-policy audits now pass with zero estimated waste.
- The representative mobile LCP heading render delay fell from 4,347 ms in the local before trace to 157 ms in candidate run 5.
- CLS is zero in the representative candidate trace.
- The final desktop trace scored 100 Performance: FCP 276 ms, LCP 635 ms, Speed Index 303 ms, TBT 2 ms, CLS 0.
- The final separate audit scored 100 Accessibility, 100 Best Practices, and 100 SEO.

## Implemented changes

- Local Inter and Sora variable fonts now use `next/font/local`, hashed preload URLs, `font-display: swap`, and adjusted fallbacks.
- Official logos are statically imported with truthful responsive `sizes`, preventing the 2,853 px source from being selected for small display slots.
- Stable public image and optimized-image cache TTL is 31 days, with one year of stale-while-revalidate for `/images/*`.
- The first partly visible marketing section is no longer deferred with `content-visibility`; only later sections are.
- Mobile textured marketing cards use lightweight gradient equivalents while desktop keeps the supplied WebP artwork.
- The marketing navigation is a Server Component; only the small mobile-menu state boundary hydrates.
- Dashboard notifications dynamically load after idle. The existing catch-up query still runs when the panel loads, so early notifications are not lost.
- Protected server checks use Supabase `getClaims()`. The project uses an asymmetric ES256 signing key, so signature and expiry validation can use cached JWKS. Profile and role queries remain RLS-protected authorization.
- Creator, brand, and admin templates wrap page content in React `ViewTransition`. Sidebar and mobile-nav links send forward/back transition types based on navigation order.
- Transition CSS uses 20 px movement over 230 ms, leaves persistent dashboard chrome in place, disables pointer input during capture, and removes animation for `prefers-reduced-motion: reduce`.
- Deal cards, creator cards, admin deal rows, user-directory rows, and entity tiles use labelled responsive field grids.
- Small purple and green marketing labels use accessible light-surface shades.

## Verification

- `npx tsc --noEmit --incremental false`: pass.
- `npm run lint`: pass.
- `npm run build`: pass, 38 generated routes.
- `npm audit --omit=dev`: zero vulnerabilities.
- `git diff --check`: pass.
- Public local routes `/`, `/about`, `/shield`, `/privacy`, `/terms`, `/login`, and `/register`: HTTP 200.
- Anonymous creator, brand, and admin overview routes: HTTP 307 to `/login`.
- Public image header: `max-age=2678400, stale-while-revalidate=31536000`.
- Homepage markup contains both font preloads.
- True Chrome device emulation at 390 x 844: viewport width 390, document width 390, no horizontal page overflow, mobile menu opens with `aria-expanded`, and its panel width is 366 px.
- Browser checks: Inter and Sora loaded, `document.startViewTransition` available, and the reduced-motion view-transition rule is present.
- Mobile and desktop marketing screenshots were visually reviewed.

## Remaining checks and guardrails

- No password or existing authenticated browser session was handled. The protected dashboard build, component markup, route guards, transition mapping, and browser API were verified, but a final signed-in visual click-through should be done with creator, brand, and admin accounts after deployment.
- The directional effect is a swipe-like page transition triggered by navigation. It does not add touch-drag gesture recognition.
- Browsers without View Transitions retain ordinary Next.js navigation.
- Lighthouse still identifies part of the shared Next.js framework runtime as unused on the homepage. Replacing framework runtime behavior for a small synthetic saving is not justified.
- Lighthouse occasionally reports a Windows temporary-directory `EPERM` during cleanup after successfully writing a valid report. It did not invalidate the saved results.
