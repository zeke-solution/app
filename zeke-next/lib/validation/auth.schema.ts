import { z } from "zod";
import { BRAND_TYPES, GUARDIAN_RELATIONS } from "@/lib/domain/constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});
export type ResetInput = z.infer<typeof resetSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

const brandRegisterSchema = z.object({
  role: z.literal("brand"),
  name: z.string().trim().min(1, "Enter your brand / company name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  brandType: z.enum(BRAND_TYPES),
  location: z.string().trim().min(1, "Enter your location."),
});

const influencerRegisterSchema = z
  .object({
    role: z.literal("influencer"),
    name: z.string().trim().min(1, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    niche: z.string().trim().min(1, "Select or enter your niche."),
    location: z.string().trim().min(1, "Enter your location."),
    igHandle: z
      .string()
      .trim()
      .min(2, "Instagram handle must be at least 2 characters.")
      .max(31, "Instagram handle is too long.")
      .regex(/^@?[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots, or underscores in your Instagram handle."),
    igFollowers: z.coerce.number().int().min(1, "Enter your Instagram follower count."),
    ytEnabled: z.boolean(),
    ytHandle: z.string().trim().optional(),
    ytFollowers: z.coerce.number().int().min(0).optional(),
    xEnabled: z.boolean(),
    xHandle: z.string().trim().optional(),
    xFollowers: z.coerce.number().int().min(0).optional(),
    isAdult: z.boolean(),
    guardianName: z.string().trim().optional(),
    guardianEmail: z.string().trim().optional(),
    guardianRelation: z.enum(GUARDIAN_RELATIONS).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.isAdult) {
      if (!v.guardianName) {
        ctx.addIssue({ code: "custom", message: "Enter guardian's name.", path: ["guardianName"] });
      }
      if (!v.guardianEmail || !z.string().email().safeParse(v.guardianEmail).success) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid guardian email.",
          path: ["guardianEmail"],
        });
      }
      if (!v.guardianRelation) {
        ctx.addIssue({
          code: "custom",
          message: "Select guardian relationship.",
          path: ["guardianRelation"],
        });
      }
    }
  });

export const registerSchema = z.discriminatedUnion("role", [
  brandRegisterSchema,
  influencerRegisterSchema,
]);
export type RegisterInput = z.infer<typeof registerSchema>;
