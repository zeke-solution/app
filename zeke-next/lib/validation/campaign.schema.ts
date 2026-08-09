import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().trim().min(3, 'Enter a clear campaign title.').max(120, 'Keep the title under 120 characters.'),
  niche: z.string().trim().min(1, 'Select a niche.'),
  platform: z.string().trim().min(1, 'Select a content platform.').max(80),
  objective: z.string().trim().min(10, 'Explain the campaign goal in at least 10 characters.').max(500, 'Keep the objective under 500 characters.'),
  deliverables: z.string().trim().min(5, 'List the content the creator must deliver.').max(1500, 'Keep deliverables under 1,500 characters.'),
  creatorRequirements: z.string().trim().max(1000, 'Keep creator requirements under 1,000 characters.').optional(),
  description: z.string().trim().max(2000, 'Keep creative direction under 2,000 characters.').optional(),
  budget: z.coerce.number().min(1, 'Enter a budget of at least ₹1.').max(100000000, 'Enter a budget below ₹10 crore.'),
  deadline: z.string().trim().min(1, 'Choose a delivery deadline.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid deadline.'),
  usageRights: z.string().trim().min(1, 'Select the content usage rights.').max(200),
  exclusivity: z.boolean(),
  paymentTerms: z.string().trim().min(1, 'Select the payment timeline.').max(200),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
