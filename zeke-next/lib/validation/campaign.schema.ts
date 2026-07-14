import { z } from "zod";

// Port of brand.js's createCampaign() validation.
export const createCampaignSchema = z.object({
  title: z.string().trim().min(1, "Enter a campaign title."),
  niche: z.string().trim().min(1, "Select a niche."),
  budget: z.coerce.number().positive("Enter a budget."),
  deadline: z.string().trim().optional(),
  description: z.string().trim().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
