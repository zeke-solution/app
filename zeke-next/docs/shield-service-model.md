# Zeke Shield service model

Status: implemented in application code and deployed to the production database.

This document is the operating and technical source of truth for Shield. It describes the product boundary; it is not legal advice. Zeke should have Indian counsel review the public terms, provider-directory approach, recovery communications, retention schedule and staff scripts before launch.

## One-sentence promise

Zeke Shield gives creators professional deal follow-ups, documented table talks, and creator-controlled access to independent legal help when a brand-deal dispute cannot be resolved informally.

## Membership price and renewal

Zeke Shield costs ₹1,999 for one month of access. Admin approval starts a one-month period. Access does not renew automatically in the current workflow; after expiry, the creator can submit a new request for another month. Existing memberships retain their recorded expiry date.

## What the monthly membership pays for

- Deal and dispute records kept in one case.
- Professional follow-ups with the brand after the creator gives permission.
- Table or settlement talks that may continue as long as the creator wishes.
- A factual directory of checked independent advocates and law firms.
- Evidence organisation and case-timeline records.
- Coordination with a directly engaged legal provider after the creator gives sharing consent.
- Shield profile and discovery benefits described on the current pricing page.

## What it does not pay for

- Lawyer or law-firm fees.
- Court, tribunal, filing, stamp, expert, travel or enforcement costs.
- A guaranteed payment, settlement, judgment or recovery.
- Legal advice or representation by Zeke.
- Legal action started without the creator's decision.

Zeke receives no referral commission, legal-fee share or percentage of a recovery. The creator hires and pays the provider directly.

## Responsibility split

| Participant | Responsible for |
| --- | --- |
| Creator | Giving accurate records; choosing whether talks continue; choosing and checking a provider; agreeing scope and fees directly; deciding whether to take legal action; controlling optional sharing. |
| Zeke | Maintaining the case record; following up within recorded consent; facilitating table talks; logging communications; showing factual provider records; coordinating authorised documents after engagement. |
| Legal provider | Conflict checks; client engagement; fee agreement; legal advice; professional confidentiality; strategy; filings; representation; outcome communications. |
| Brand | Responding to the dispute and meeting its contractual and legal obligations. |

Zeke is a case coordinator. It is not a law firm, advocate, legal representative, payment guarantor, provider-ranking service or party to the creator-provider engagement.

## Case flow

1. A dispute is opened on an eligible deal.
2. If the deal's creator has active Shield, the database automatically creates one Shield case for the dispute.
3. The creator sees the case in `/creator/shield` and chooses:
   - `follow_up`: authorise Zeke to contact the brand; or
   - `legal`: acknowledge separate costs and browse checked provider records.
4. During follow-up, Zeke logs every material contact and may move the operational stage to settlement talks.
5. The creator can continue talks or move to provider selection at any time.
6. The creator selects and contacts a provider directly.
7. Provider selection records the creator's choice and cost/independence acknowledgements but does not force sharing consent or claim an engagement exists.
8. The creator confirms only after directly hiring the provider.
9. Zeke may then coordinate records and communications the creator authorised.
10. The creator may stop future optional sharing from the case page. Previously shared copies cannot be recalled by the platform.
11. An admin records a clear outcome before resolving or closing the case.

## State machine

| State | Meaning | Who controls the transition |
| --- | --- | --- |
| `intake` | Case created; creator choice is pending. | System creates; creator chooses next path. |
| `assisted_follow_up` | Zeke has brand-contact consent and is conducting follow-ups. | Creator selects; admin documents work. |
| `settlement_talks` | Table or settlement discussions are active. | Admin records stage; creator still decides whether to continue. |
| `lawyer_selection` | Creator is reviewing/contacting checked providers. | Creator selects legal path/provider. |
| `legal_coordination` | Direct engagement is confirmed and current sharing consent exists. | Creator confirms engagement; database blocks admin-only escalation. |
| `resolved` | A documented resolution exists. | Admin records status note and outcome. |
| `closed` | Support case ended with a documented outcome. | Admin records status note and outcome. |

The old generic admin “Escalate” button is intentionally removed. Moving toward independent legal help is a creator decision.

## Data model

### `legal_providers`

Factual provider directory. It contains provider type, scale, location, languages, self-reported matter types, contact routes, fee note, enrolment/verification reference, checked timestamp and visibility status.

Creator visibility requires all three:

- active Shield membership;
- `active = true`; and
- `verified_at` is present.

Do not add star ratings, comparative rankings, “best” labels, outcome claims, testimonials, paid placement or specialisation claims without specific legal approval.

### `shield_cases`

One row per eligible dispute. It stores the creator-controlled path, operational status, selected provider, separate brand-contact and provider-sharing consents, cost and independence acknowledgements, engagement timestamp, outcome and closure timestamps.

### `shield_case_updates`

Append-only audit timeline written through security-definer functions. Creator-visible and admin-only entries have separate audiences. Admin-only text must never appear in creator notifications.

### `shield_case_documents`

Metadata for evidence stored in the private `shield-case-files` bucket. Files are limited to 10 MB and approved document/image MIME types. A database policy blocks `shared_with_provider = true` unless the case has a selected provider and active sharing consent.

## Permission rules

- Creators can read only their own Shield cases, visible timeline entries and case documents.
- Admins can read and operate all Shield cases.
- Brands do not receive access to the private Shield workspace or its evidence vault.
- Shield members can read checked active provider records; free users cannot.
- Clients cannot directly edit case status, consents or the timeline.
- Creator choices and admin transitions use audited RPCs.
- Legal coordination is blocked until direct engagement is confirmed and consent remains active.
- Closing/resolving a case requires an explicit outcome.
- Private evidence uses signed links with short expiry.

## Staff operating procedure

For every follow-up or table talk, record:

- date and channel;
- who was contacted or attended;
- what was said or proposed in neutral language;
- any promised payment or deadline;
- the creator's current instruction; and
- the next agreed step.

Do not:

- threaten criminal, regulatory or publicity action as leverage;
- describe Zeke staff as lawyers or legal representatives;
- accept or reject a settlement for the creator;
- promise recovery or success;
- recommend a provider based on payment or commission;
- forward evidence without recorded consent;
- log privileged legal advice in a general creator-visible note without provider/client approval; or
- move a case to legal coordination before engagement confirmation.

## Provider onboarding checklist

Before setting `verified_at` and activating a record:

- confirm the advocate/law-firm identity and current contact routes;
- record the relevant enrolment or verification reference;
- obtain permission to show the factual profile;
- confirm the provider handles enquiries independently and performs its own conflict check;
- confirm fees are agreed and collected directly from the creator;
- confirm Zeke receives no referral payment or recovery share;
- agree secure document and communication channels;
- review wording for factual accuracy and prohibited promotional claims; and
- record the date and staff member who completed the check.

## Privacy and evidence handling

- Collect only records relevant to the dispute.
- Explain the purpose before upload or sharing.
- Keep consent separate for brand contact and provider sharing.
- Make withdrawal of future optional sharing as easy as giving consent.
- Preserve the audit record of consent and withdrawal.
- Do not claim that withdrawal recalls records already received by a provider.
- Define retention periods with counsel before launch.
- Use secure deletion procedures when retention is no longer justified.

## Main implementation locations

- Migrations: `supabase/migrations/0004_shield_case_coordination.sql` through `0009_monthly_shield_membership.sql`
- Creator routes: `app/creator/shield/`
- Admin cases: `app/admin/shield/cases/`
- Provider pool: `app/admin/legal-pool/`
- Server actions: `actions/shield-cases.ts`, `actions/shield-consent.ts`
- Public explainer: `app/(marketing)/shield/page.tsx`
- Terms and privacy: `app/terms/page.tsx`, `app/(marketing)/privacy/page.tsx`

## Pre-deployment checklist

- Obtain Indian counsel review of Shield terms, staff follow-up scripts and provider-directory operation.
- Back up the production database.
- Review pending Shield migrations in a Supabase dry run.
- Apply migrations in numeric order.
- Add at least one checked provider record but keep it inactive until permission and verification are complete.
- Test with separate creator, brand and admin accounts.
- Confirm a non-Shield creator cannot view the provider directory.
- Confirm a creator cannot see another creator's case or evidence.
- Confirm a brand cannot read the Shield case workspace.
- Confirm an admin-only note does not notify or display to the creator.
- Confirm unverified/inactive providers cannot be selected through a direct API call.
- Confirm provider sharing cannot be marked without consent.
- Confirm withdrawal blocks future legal-coordination logging.
- Confirm case closure fails without an outcome.
- Confirm signed evidence links expire.

## Official references used for product safeguards

- Bar Council of India, BCI Rules: https://www.barcouncilofindia.org/info/bci-rules
- Bar Council of India, duties toward clients: https://www.barcouncilofindia.org/info/rules-on-an-advocates-duty-towards-the-client
- India Code, Advocates Act 1961: https://www.indiacode.nic.in/handle/123456789/1631?locale=en
- MeitY, Digital Personal Data Protection Rules 2025: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
- MeitY, Digital Personal Data Protection Act 2023: https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf
