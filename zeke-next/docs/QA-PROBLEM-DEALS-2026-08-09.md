# Production problematic-deal QA - 2026-08-09

## Scope

- Environment: linked production Supabase project and the current production application schema.
- Run label: `QA-20260809113327`.
- Accounts: the retained creator and brand accounts. Passwords were not changed. Temporary one-time sessions were generated for the QA run.
- Administration: one temporary QA admin was created for admin-only workflows and removed after testing. The final account audit still reports exactly two auth users and zero admin profiles.
- Persistence: the 10 QA deals and their supporting data remain available in the creator and brand dashboards for inspection.

## Outcome

- Checks executed: 218
- Passed: 216
- Failed: 2
- Core deal-state, RLS, transaction, cancellation, dispute, payment, Shield, and consent guards passed.
- The two failed checks expose real production gaps rather than corrupting any scenario state.

## Ten scenarios

| # | Scenario | Final status | Result |
|---|---|---|---|
| 1 | Duplicate campaign offer | `negotiating` | A second non-cancelled offer for the same campaign and creator was blocked. Closing the campaign preserved the existing negotiation. |
| 2 | Locked terms after acceptance | `active` | Brand edits worked while negotiating. A post-acceptance amount change was blocked by the database trigger. |
| 3 | Chat permissions and Realtime | `active` | Creator and brand chat writes worked. A non-party admin write was blocked. Realtime delivery timed out because the publication is not configured. |
| 4 | Rejected content resubmission | `approved` | A foreign file path and a rejection without a note were blocked. Round 1 was rejected and round 2 was approved. |
| 5 | Invalid and duplicate final link | `link_submitted` | A `javascript:` URL and a second link submission were blocked. The valid HTTPS link was stored. |
| 6 | Underpayment and payment mismatch | `completed` | Underpayment and a mismatched payment identifier were blocked. Exact payment completed the deal. A completed deal could not be disputed. |
| 7 | Concurrent double payment | `completed` | Two simultaneous payment requests serialized correctly. One succeeded, one returned `wrong_status`, and one payment row remained. |
| 8 | Conflicting cancellation requests | `cancelled` | Cancellation decline, opposite-party request, self-accept rejection, and other-party acceptance all behaved correctly. |
| 9 | Dispute blocks pending cancellation | `disputed` | A pending cancellation could not close the deal after a dispute opened. The dispute is intentionally left escalated for inspection. |
| 10 | Shield follow-up and legal coordination | `active` | Monthly Shield activation, duplicate-request guard, assisted follow-up consent, private admin note, verified-provider selection, legal acknowledgements, evidence upload, sharing withdrawal, renewed consent, coordination, outcome requirement, case resolution, and deal-state restoration all passed. |

## Final production data from the run

- 1 campaign
- 10 deals
- 45 deal messages
- 5 submissions
- 3 final links
- 2 payments
- 9 agreements
- 2 disputes
- 44 notifications
- 1 activated Shield request
- 1 resolved Shield case
- 13 Shield case updates
- 1 Shield evidence record
- 2 clearly labelled QA legal-provider records
- 6 Storage objects
- 2 auth users and 0 admin profiles

## Confirmed gaps

### 1. Realtime publication is empty

`pg_publication_tables` returns zero public tables for `supabase_realtime`. The client subscriptions for `deal_messages` and `notifications` therefore do not receive inserts. This prevents live chat fan-out and the new in-app notification popup from working in production even though the component subscriptions are implemented.

Recommended correction: add `public.deal_messages` and `public.notifications` to `supabase_realtime` through a reviewed migration, then repeat a live two-session event test.

### 2. Whitespace-only chat can bypass the Server Action

`actions/chat.ts` correctly trims content and rejects empty or over-4,000-character messages. A directly authenticated PostgREST insert containing only spaces is still accepted because the table has no equivalent constraint. The QA row was deleted immediately.

Recommended correction: add a database constraint requiring non-blank text messages and enforce the 4,000-character limit as defense in depth.

### 3. Final-link submission does not notify the brand

The valid final-link transition succeeded, but the brand notification count did not change. This matches the known behavior preserved in migration 0003.

Recommended correction: insert a brand notification inside `submit_final_link_transaction` so the transition and notification remain atomic.

### 4. Payment confirmation does not notify the brand

Creator confirmation correctly completed the deal, but the brand notification count did not change. This also matches the known behavior preserved in migration 0003.

Recommended correction: insert a brand notification inside `confirm_payment_transaction` so completion and notification remain atomic.

## Important operating state

- The retained creator now has an active one-month Shield membership from the QA activation.
- Problem deal 9 has an escalated dispute and a pending cancellation, deliberately demonstrating the close guard.
- Problem deal 10 has a resolved Shield case and a resolved dispute; its deal status was restored to `active`.
- There is no permanent admin account. Admin-only follow-up requires the owner to create or designate an admin account explicitly.
