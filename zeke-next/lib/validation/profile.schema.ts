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
  // Bounded and charset-restricted like igHandle above. These values are
  // stored verbatim and interpolated into outbound profile links, so
  // unvalidated text has no business reaching the database. YouTube handles
  // permit hyphens; X handles do not.
  ytHandle: z
    .string()
    .trim()
    .max(60, "YouTube handle is too long.")
    .regex(/^@?[a-zA-Z0-9._-]+$/, "Use only letters, numbers, dots, hyphens, or underscores.")
    .optional()
    .or(z.literal("")),
  ytFollowers: z.coerce.number().int().min(0).optional(),
  xEnabled: z.boolean(),
  xHandle: z
    .string()
    .trim()
    .max(30, "X handle is too long.")
    .regex(/^@?[a-zA-Z0-9_]+$/, "Use only letters, numbers, or underscores.")
    .optional()
    .or(z.literal("")),
  xFollowers: z.coerce.number().int().min(0).optional(),
});
export type UpdateInfluencerProfileInput = z.infer<typeof updateInfluencerProfileSchema>;
