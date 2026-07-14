import { z } from "zod";

// Port of creator.js's saveProfile() validation.
export const updateInfluencerProfileSchema = z.object({
  igHandle: z.string().trim().min(1, "Instagram handle is required."),
  igFollowers: z.coerce.number().int().min(1, "Instagram follower count is required."),
  ytEnabled: z.boolean(),
  ytHandle: z.string().trim().optional(),
  ytFollowers: z.coerce.number().int().min(0).optional(),
  xEnabled: z.boolean(),
  xHandle: z.string().trim().optional(),
  xFollowers: z.coerce.number().int().min(0).optional(),
});
export type UpdateInfluencerProfileInput = z.infer<typeof updateInfluencerProfileSchema>;
