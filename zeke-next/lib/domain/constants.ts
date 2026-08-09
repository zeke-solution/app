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

export const CAMPAIGN_PLATFORM_OPTIONS = [
  'Instagram Reel',
  'Instagram Post',
  'Instagram Stories',
  'YouTube Video',
  'YouTube Short',
  'X Post / Thread',
  'Multi-platform',
] as const;

export const USAGE_RIGHTS_OPTIONS = [
  'Creator channels only',
  'Organic brand use - 30 days',
  'Organic brand use - 90 days',
  'Paid media use - 30 days',
  'Paid media use - 90 days',
  'Perpetual brand use',
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  '100% after final approval',
  '50% upfront - 50% after final approval',
  'Within 7 days of final approval',
  'Within 15 days of final approval',
  'Within 30 days of final approval',
] as const;

export const SHIELD_MONTHLY_PRICE_INR = 1999;

// supabase/schema.sql storage bucket comment block.
export const STORAGE_BUCKETS = {
  submissions: "submissions",
  paymentProof: "payment-proof",
  agreements: "agreements",
  avatars: "avatars",
} as const;

// Zeke's application and submissions-bucket limit. The Supabase project's global
// Storage limit must also be at least this value.
export const SUBMISSION_MAX_SIZE_MB = 100;
export const SUBMISSION_ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
