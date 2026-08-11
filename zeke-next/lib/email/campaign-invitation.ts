import "server-only";

import { fmtNum } from "@/lib/domain/format";

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const FROM_ADDRESS = "Zeke <no-reply@zekesolution.com>";

export interface CampaignInvitationEmail {
  dealId: string;
  to: string;
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  platform: string;
  amount: number | null;
  deadline: string | null;
}

export interface CampaignInvitationEmailResult {
  ok: boolean;
  sent: number;
}

export async function sendCampaignInvitationEmails(
  invitations: CampaignInvitationEmail[],
): Promise<CampaignInvitationEmailResult> {
  if (invitations.length === 0) return { ok: true, sent: 0 };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] campaign invitation delivery is not configured");
    return { ok: false, sent: 0 };
  }

  let siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://zekesolution.com";
  while (siteUrl.endsWith("/")) siteUrl = siteUrl.slice(0, -1);
  const offersUrl = siteUrl + "/creator/offers";
  const firstDealId = invitations[0]?.dealId ?? "unknown";

  const response = await fetch(RESEND_BATCH_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key":
        "campaign-invitations-" + firstDealId + "-" + invitations.length,
      "User-Agent": "zeke-app/1.0",
    },
    body: JSON.stringify(
      invitations.map((invitation) => ({
        from: FROM_ADDRESS,
        to: [invitation.to],
        subject:
          "New campaign invitation from " +
          singleLine(invitation.brandName).slice(0, 80),
        html: invitationHtml(invitation, offersUrl),
        text: invitationText(invitation, offersUrl),
        tags: [
          { name: "email_type", value: "campaign_invitation" },
          { name: "deal_id", value: invitation.dealId },
        ],
      })),
    ),
  });

  if (!response.ok) {
    console.error("[email] campaign invitation delivery failed", {
      status: response.status,
      invitationCount: invitations.length,
    });
    return { ok: false, sent: 0 };
  }

  return { ok: true, sent: invitations.length };
}

function invitationHtml(
  invitation: CampaignInvitationEmail,
  offersUrl: string,
) {
  const creatorName = escapeHtml(invitation.creatorName || "Creator");
  const brandName = escapeHtml(invitation.brandName || "A brand");
  const campaignTitle = escapeHtml(invitation.campaignTitle);
  const platform = escapeHtml(invitation.platform);
  const amount = escapeHtml("₹" + fmtNum(invitation.amount));
  const deadline = invitation.deadline
    ? escapeHtml(formatDeadline(invitation.deadline))
    : "Confirm in Zeke";
  const safeOffersUrl = escapeHtml(offersUrl);

  return [
    '<!doctype html><html lang="en"><body style="margin:0;background:#f5f3f8;font-family:Arial,Helvetica,sans-serif;color:#241d31;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3f8;padding:32px 12px;"><tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(36,29,49,0.10);">',
    '<tr><td style="background:#100c19;padding:24px 32px;"><img src="https://zekesolution.com/images/zeke-logo-white.png" width="112" alt="Zeke" style="display:block;width:112px;height:auto;"></td></tr>',
    '<tr><td style="padding:34px 32px 30px;">',
    '<div style="font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7c3aed;">Campaign invitation</div>',
    '<h1 style="margin:10px 0 12px;font-size:25px;line-height:1.3;color:#21182f;">You have a new creator offer</h1>',
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#6e6679;">Hi ' +
      creatorName +
      ', <strong style="color:#352846;">' +
      brandName +
      '</strong> invited you to review a campaign on Zeke.</p>',
    '<div style="background:#f5f3f8;border-radius:14px;padding:17px 18px;margin-bottom:20px;">',
    '<div style="font-size:16px;font-weight:700;color:#21182f;">' +
      campaignTitle +
      '</div>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:13px;font-size:13px;line-height:1.5;color:#6e6679;">',
    '<tr><td style="padding:4px 0;">Platform</td><td align="right" style="padding:4px 0;font-weight:700;color:#352846;">' +
      platform +
      '</td></tr>',
    '<tr><td style="padding:4px 0;">Creator fee</td><td align="right" style="padding:4px 0;font-weight:700;color:#92400e;">' +
      amount +
      '</td></tr>',
    '<tr><td style="padding:4px 0;">Deadline</td><td align="right" style="padding:4px 0;font-weight:700;color:#352846;">' +
      deadline +
      "</td></tr></table></div>",
    '<a href="' +
      safeOffersUrl +
      '" style="display:block;padding:14px 20px;border-radius:12px;background:#7c3aed;color:#ffffff;text-decoration:none;text-align:center;font-size:15px;font-weight:700;">Review invitation in Zeke</a>',
    '<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8a8295;">Review the complete brief and terms before accepting. You can negotiate with the brand in Zeke chat. This email does not mean you have accepted the campaign.</p>',
    "</td></tr>",
    '<tr><td style="background:#faf9fc;padding:18px 32px;font-size:11px;line-height:1.5;color:#9a93a3;">Zeke - structured collaborations, recorded clearly.</td></tr>',
    "</table></td></tr></table></body></html>",
  ].join("");
}

function invitationText(
  invitation: CampaignInvitationEmail,
  offersUrl: string,
) {
  return [
    "New campaign invitation on Zeke",
    "",
    "Hi " + (invitation.creatorName || "Creator") + ",",
    (invitation.brandName || "A brand") + " invited you to review:",
    invitation.campaignTitle,
    "Platform: " + invitation.platform,
    "Creator fee: ₹" + fmtNum(invitation.amount),
    "Deadline: " +
      (invitation.deadline
        ? formatDeadline(invitation.deadline)
        : "Confirm in Zeke"),
    "",
    "Review the complete brief and negotiate before accepting:",
    offersUrl,
    "",
    "This email does not mean you have accepted the campaign.",
  ].join(String.fromCharCode(10));
}

function formatDeadline(value: string) {
  const date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function singleLine(value: string) {
  return value
    .replaceAll(String.fromCharCode(13), " ")
    .replaceAll(String.fromCharCode(10), " ")
    .split(" ")
    .filter(Boolean)
    .join(" ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
