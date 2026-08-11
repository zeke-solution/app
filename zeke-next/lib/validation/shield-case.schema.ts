import { z } from "zod";

export const shieldCasePathSchema = z.enum(["follow_up", "legal"]);

export const shieldCaseStatusSchema = z.enum([
  "intake",
  "assisted_follow_up",
  "settlement_talks",
  "lawyer_selection",
  "legal_coordination",
  "resolved",
  "closed",
]);

export const shieldUpdateKindSchema = z.enum([
  "follow_up",
  "settlement_talk",
  "legal_coordination",
  "note",
]);

export const shieldDocumentCategorySchema = z.enum([
  "agreement",
  "invoice",
  "communication",
  "payment_record",
  "deliverable",
  "legal",
  "other",
]);

export const legalProviderSchema = z
  .object({
    id: z.string().uuid().optional(),
    displayName: z.string().trim().min(2).max(160),
    providerType: z.enum(["advocate", "law_firm"]),
    firmScale: z.enum(["independent", "boutique", "mid_size", "full_service"]),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    languages: z.array(z.string().trim().min(1).max(50)).max(20),
    matterTypes: z.array(z.string().trim().min(1).max(100)).max(30),
    profileSummary: z.string().trim().max(1200).optional(),
    feeNote: z.string().trim().max(500).optional(),
    contactEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
    contactPhone: z.string().trim().max(30).optional(),
    website: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => {
          if (!value) return true;
          try {
            const url = new URL(value);
            return (
              (url.protocol === "https:" || url.protocol === "http:") &&
              !url.username &&
              !url.password
            );
          } catch {
            return false;
          }
        },
        { message: "Use a valid HTTP or HTTPS website URL." },
      )
      .optional(),
    enrollmentReference: z.string().trim().max(160).optional(),
    verified: z.boolean(),
    active: z.boolean(),
  })
  .refine((value) => value.contactEmail || value.contactPhone || value.website, {
    message: "Add at least one direct contact method.",
    path: ["contactEmail"],
  });

export type LegalProviderInput = z.infer<typeof legalProviderSchema>;
