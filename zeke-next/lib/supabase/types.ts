// Hand-written from supabase/schema.sql (no DB introspection available in
// this environment). Once `supabase` CLI access exists, replace with
// `supabase gen types typescript` output — keep the shape compatible.

type Role = "influencer" | "brand" | "admin";
type BrandType = "business" | "ngo" | "agency";
type DealStatus =
  | "negotiating"
  | "agreement_sent"
  | "active"
  | "submitted"
  | "approved"
  | "link_submitted"
  | "payment_sent"
  | "completed"
  | "cancelled"
  | "disputed";
type CampaignStatus = "active" | "paused" | "closed";
type MsgType = "text" | "offer" | "event" | "event_gold";
type SubmissionStatus = "pending" | "approved" | "rejected";
type PaymentStatus = "pending" | "confirmed";
type DisputeStatus = "open" | "resolved" | "escalated";
type ShieldStatus = "pending" | "activated" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          display_name: string;
          location: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          role: Role;
          display_name: string;
          location?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      influencer_profiles: {
        Row: {
          id: string;
          handle: string | null;
          niche: string | null;
          is_adult: boolean | null;
          ig_followers: number;
          yt_followers: number | null;
          x_followers: number | null;
          yt_handle: string | null;
          x_handle: string | null;
          yt_enabled: boolean | null;
          x_enabled: boolean | null;
          rating: number | null;
          shield_active: boolean | null;
          shield_expires: string | null;
          verified: boolean | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["influencer_profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["influencer_profiles"]["Row"]>;
      };
      brand_profiles: {
        Row: {
          id: string;
          brand_type: BrandType | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["brand_profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["brand_profiles"]["Row"]>;
      };
      guardians: {
        Row: {
          id: string;
          influencer_id: string | null;
          guardian_name: string;
          guardian_email: string;
          relation: string;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["guardians"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guardians"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          brand_id: string | null;
          title: string;
          niche: string | null;
          budget: number | null;
          currency: string | null;
          deadline: string | null;
          description: string | null;
          status: CampaignStatus | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          campaign_id: string | null;
          brand_id: string | null;
          influencer_id: string | null;
          title: string;
          platform: string | null;
          amount: number | null;
          currency: string | null;
          deliverables: string | null;
          usage_rights: string | null;
          exclusivity: boolean | null;
          payment_terms: string | null;
          deadline: string | null;
          status: DealStatus;
          cancel_requested_by: string | null;
          cancel_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      deal_messages: {
        Row: {
          id: string;
          deal_id: string | null;
          sender_id: string | null;
          msg_type: MsgType | null;
          content: string;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["deal_messages"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deal_messages"]["Insert"]>;
      };
      submissions: {
        Row: {
          id: string;
          deal_id: string | null;
          round: number | null;
          file_url: string | null;
          file_name: string | null;
          file_size_mb: number | null;
          status: SubmissionStatus | null;
          review_note: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["submissions"]["Row"], "id" | "submitted_at" | "reviewed_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
      final_links: {
        Row: {
          id: string;
          deal_id: string | null;
          url: string;
          submitted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["final_links"]["Row"], "id" | "submitted_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["final_links"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          deal_id: string | null;
          amount: number | null;
          currency: string | null;
          proof_url: string | null;
          sent_by: string | null;
          confirmed_by: string | null;
          status: PaymentStatus | null;
          sent_at: string | null;
          confirmed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      agreements: {
        Row: {
          id: string;
          deal_id: string | null;
          pdf_url: string | null;
          generated_at: string | null;
          signed_brand: boolean | null;
          signed_creator: boolean | null;
        };
        Insert: Omit<Database["public"]["Tables"]["agreements"]["Row"], "id" | "generated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agreements"]["Insert"]>;
      };
      disputes: {
        Row: {
          id: string;
          deal_id: string | null;
          raised_by: string | null;
          reason: string;
          status: DisputeStatus | null;
          resolution: string | null;
          previous_deal_status: DealStatus | null;
          created_at: string | null;
          resolved_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["disputes"]["Row"], "id" | "created_at" | "resolved_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["disputes"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string | null;
          type: string | null;
          read: boolean | null;
          // Added during the Next.js migration (deviation #3 in the plan) so
          // notification items can deep-link to /[role]/deals/[dealId].
          // Requires: alter table public.notifications
          //   add column related_deal_id uuid references public.deals(id);
          related_deal_id: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      shield_requests: {
        Row: {
          id: string;
          influencer_id: string | null;
          amount: number | null;
          currency: string | null;
          status: ShieldStatus | null;
          requested_at: string | null;
          activated_at: string | null;
          expires_at: string | null;
          note: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["shield_requests"]["Row"], "id" | "requested_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shield_requests"]["Insert"]>;
      };
    };
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_body?: string | null;
          p_type?: string | null;
          p_related_deal_id?: string | null;
        };
        Returns: string;
      };
      activate_shield_request: {
        Args: { p_request_id: string };
        Returns: boolean;
      };
      reject_shield_request: {
        Args: { p_request_id: string; p_reason: string };
        Returns: boolean;
      };
      resolve_dispute_transaction: {
        Args: { p_dispute_id: string; p_resolution: string };
        Returns: boolean;
      };
      escalate_dispute_transaction: {
        Args: { p_dispute_id: string };
        Returns: boolean;
      };
    };
  };
}
