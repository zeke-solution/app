import { z } from "zod";

export const updateInfluencerProfileSchema = z.object({
  igHandle: z
    .string()
    .trim()
    .min(2, "Profile handle must be at least 2 characters.")
    .max(31, "Profile handle is too long.")
    .regex(/^@?[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots, or underscores in your handle."),
  igFollowers: z.coerce.number().int().min(1, "Instagram follower count is required."),
  ytEnabled: z.boolean(),
  ytHandle: z.string().trim().optional(),
  ytFollowers: z.coerce.number().int().min(0).optional(),
  xEnabled: z.boolean(),
  xHandle: z.string().trim().optional(),
  xFollowers: z.coerce.number().int().min(0).optional(),
});
export type UpdateInfluencerProfileInput = z.infer<typeof updateInfluencerProfileSchema>;
