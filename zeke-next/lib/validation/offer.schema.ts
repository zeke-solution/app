import { z } from 'zod';

export const sendCampaignOffersSchema = z.object({
  campaignId: z.string().uuid(),
  influencerIds: z
    .array(z.string().uuid())
    .min(1, 'Pick at least one creator.')
    .max(100, 'Send campaign offers to at most 100 creators at a time.'),
  platform: z.string().trim().max(80).optional(),
});
export type SendCampaignOffersInput = z.infer<typeof sendCampaignOffersSchema>;

export const respondToOfferSchema = z.object({
  dealId: z.string().uuid(),
  seenUpdatedAt: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .refine((value) => Number.isFinite(Date.parse(value)), 'Invalid offer version.'),
});
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;

export const editOfferSchema = z.object({
  dealId: z.string().uuid(),
  title: z.string().trim().min(1, 'Enter a title.'),
  platform: z.string().trim().min(1, 'Enter the platform.'),
  amount: z.coerce.number().positive('Enter a valid amount.'),
  deliverables: z.string().trim().optional(),
  deadline: z.string().trim().optional(),
});
export type EditOfferInput = z.infer<typeof editOfferSchema>;
