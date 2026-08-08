// Ported verbatim from the <select> options duplicated across auth.html
// (registration), brand.html (campaign form + discover filter), and
// brand.js's campaign-send modal niche filter.
export const NICHE_OPTIONS = [
  "Lifestyle",
  "Food & Cooking",
  "Travel",
  "Fashion & Beauty",
  "Tech & Gadgets",
  "Health & Fitness",
  "Finance",
  "Education",
  "Entertainment",
  "Gaming",
  "Real Estate",
  "Automotive",
  "Parenting",
  "Comedy / Meme",
  "Business / Entrepreneurship",
] as const;

// auth.html's <select id="guardian-relation">.
export const GUARDIAN_RELATIONS = [
  "Parent",
  "Legal Guardian",
  "Sibling (18+)",
  "Other Authorized Person",
] as const;

export const BRAND_TYPES = ["business", "ngo", "agency"] as const;

export const SHIELD_MONTHLY_PRICE_INR = 1999;

// supabase/schema.sql storage bucket comment block.
export const STORAGE_BUCKETS = {
  submissions: "submissions",
  paymentProof: "payment-proof",
  agreements: "agreements",
  avatars: "avatars",
} as const;

// js/creator.js's submissions upload UI copy ("MP4, MOV, JPG up to 200MB")
// and handleFileSelect()'s lack of real validation — now enforced for real
// in lib/validation/submission.schema.ts (Phase 6).
export const SUBMISSION_MAX_SIZE_MB = 200;
export const SUBMISSION_ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
