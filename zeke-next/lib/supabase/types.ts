// Hand-written from supabase/schema.sql (no DB introspection available in
// this environment). Once `supabase` CLI access exists, replace with
// `supabase gen types typescript` output - keep the shape compatible.

type Role = "pending" | "influencer" | "brand" | "admin";
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
type LegalProviderType = "advocate" | "law_firm";
type LegalProviderScale = "independent" | "boutique" | "mid_size" | "full_service";
type ShieldCaseStatus =
  | "intake"
  | "assisted_follow_up"
  | "settlement_talks"
  | "lawyer_selection"
  | "legal_coordination"
  | "resolved"
  | "closed";
type ShieldCasePath = "undecided" | "follow_up" | "legal";
type ShieldCaseActorRole = "creator" | "admin" | "system";
type ShieldCaseUpdateKind =
  | "case_opened"
  | "creator_decision"
  | "follow_up"
  | "settlement_talk"
  | "provider_selected"
  | "engagement_confirmed"
  | "legal_coordination"
  | "document_added"
  | "status_change"
  | "note"
  | "outcome";
type ShieldCaseDocumentCategory =
  | "agreement"
  | "invoice"
  | "communication"
  | "payment_record"
  | "deliverable"
  | "legal"
  | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          display_name: string;
          location: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          created_at: string | null;
        };
        Insert: {
          id: string;
          role: Role;
          display_name: string;
          location?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
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
          platform: string | null;
          objective: string | null;
          deliverables: string | null;
          creator_requirements: string | null;
          usage_rights: string | null;
          exclusivity: boolean;
          payment_terms: string | null;
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
          creator_chat_closed_at: string | null;
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
      legal_providers: {
        Row: {
          id: string;
          display_name: string;
          provider_type: LegalProviderType;
          firm_scale: LegalProviderScale;
          city: string | null;
          state: string | null;
          languages: string[];
          matter_types: string[];
          profile_summary: string | null;
          fee_note: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          website: string | null;
          enrollment_reference: string | null;
          verified_at: string | null;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["legal_providers"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["legal_providers"]["Insert"]>;
      };
      shield_cases: {
        Row: {
          id: string;
          dispute_id: string;
          creator_id: string;
          status: ShieldCaseStatus;
          creator_path: ShieldCasePath;
          selected_provider_id: string | null;
          contact_brand_consent: boolean;
          share_with_provider_consent: boolean;
          legal_cost_acknowledged: boolean;
          independent_advice_acknowledged: boolean;
          creator_decided_at: string | null;
          engagement_confirmed_at: string | null;
          outcome: string | null;
          opened_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shield_cases"]["Row"],
          "id" | "opened_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["shield_cases"]["Insert"]>;
      };
      shield_case_updates: {
        Row: {
          id: string;
          case_id: string;
          actor_id: string | null;
          actor_role: ShieldCaseActorRole;
          kind: ShieldCaseUpdateKind;
          body: string;
          audience: "creator_and_admin" | "admin_only";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shield_case_updates"]["Row"],
          "id" | "created_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["shield_case_updates"]["Insert"]>;
      };
      shield_case_documents: {
        Row: {
          id: string;
          case_id: string;
          uploaded_by: string;
          category: ShieldCaseDocumentCategory;
          file_name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          shared_with_provider: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shield_case_documents"]["Row"],
          "id" | "created_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["shield_case_documents"]["Insert"]>;
      };
      admin_removal_jobs: {
        Row: {
          id: string;
          actor_id: string | null;
          entity_type:
            | "user"
            | "campaign"
            | "deal"
            | "dispute"
            | "shield_request"
            | "shield_case"
            | "legal_provider";
          entity_id: string;
          entity_label: string;
          status: "pending" | "database_complete" | "needs_review" | "complete";
          details: Record<string, unknown>;
          storage_refs: Array<{ bucket: string; value: string }>;
          last_error: string | null;
          attempt_count: number;
          database_completed_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["admin_removal_jobs"]["Row"],
          | "id"
          | "status"
          | "details"
          | "storage_refs"
          | "last_error"
          | "attempt_count"
          | "database_completed_at"
          | "completed_at"
          | "created_at"
          | "updated_at"
        > & {
          id?: string;
          status?: Database["public"]["Tables"]["admin_removal_jobs"]["Row"]["status"];
          details?: Record<string, unknown>;
          storage_refs?: Array<{ bucket: string; value: string }>;
          last_error?: string | null;
          attempt_count?: number;
          database_completed_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_removal_jobs"]["Row"]>;
      };
      admin_removal_audit: {
        Row: {
          id: string;
          job_id: string | null;
          actor_id: string | null;
          entity_type:
            | "user"
            | "campaign"
            | "deal"
            | "dispute"
            | "shield_request"
            | "shield_case"
            | "legal_provider";
          entity_id: string;
          entity_label: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["admin_removal_audit"]["Row"],
          "id" | "job_id" | "created_at"
        > & { id?: string; job_id?: string | null };
        Update: never;
      };
    };
    Functions: {
      admin_prepare_removal: {
        Args: { p_job_id: string; p_actor_id: string };
        Returns: Record<string, unknown>;
      };
      admin_complete_removal: {
        Args: {
          p_job_id: string;
          p_actor_id: string;
          p_storage_warnings?: unknown[];
        };
        Returns: undefined;
      };
      get_public_creator_profile: {
        Args: { p_handle: string };
        Returns: Array<{
          display_name: string;
          location: string | null;
          avatar_url: string | null;
          handle: string;
          niche: string | null;
          ig_followers: number;
          yt_followers: number | null;
          x_followers: number | null;
          yt_enabled: boolean;
          x_enabled: boolean;
          rating: number | null;
          verified: boolean;
          shield_active: boolean;
          completed_deals: number;
        }>;
      };
      set_profile_avatar: {
        Args: { p_object_path: string; p_avatar_url: string };
        Returns: string | null;
      };
      complete_google_onboarding: {
        Args: {
          p_role: "influencer" | "brand";
          p_display_name: string;
          p_location: string;
          p_brand_type: BrandType | null;
          p_niche: string | null;
          p_handle: string | null;
          p_ig_followers: number | null;
          p_yt_enabled: boolean | null;
          p_yt_handle: string | null;
          p_yt_followers: number | null;
          p_x_enabled: boolean | null;
          p_x_handle: string | null;
          p_x_followers: number | null;
          p_is_adult: boolean | null;
          p_guardian_name: string | null;
          p_guardian_email: string | null;
          p_guardian_relation: string | null;
        };
        Returns: string | null;
      };
      set_creator_chat_closed: {
        Args: { p_deal_id: string; p_closed: boolean };
        Returns: string | null;
      };
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
      respond_to_offer_transaction: {
        Args: {
          p_deal_id: string;
          p_decision: "accept" | "decline";
          p_seen_updated_at: string;
        };
        Returns: string | null;
      };
      // 0003_atomic_transitions.sql. These return null on success or a short
      // error code; TransitionCode in lib/domain/transitions.ts maps the codes
      // to user-facing copy.
      submit_content_transaction: {
        Args: {
          p_deal_id: string;
          p_file_url: string;
          p_file_name: string;
          p_file_size_mb: number;
        };
        Returns: string | null;
      };
      review_submission_transaction: {
        Args: {
          p_submission_id: string;
          p_deal_id: string;
          p_decision: "approved" | "rejected";
          p_note?: string | null;
        };
        Returns: string | null;
      };
      submit_final_link_transaction: {
        Args: { p_deal_id: string; p_url: string };
        Returns: string | null;
      };
      mark_payment_sent_transaction: {
        Args: { p_deal_id: string; p_amount: number };
        Returns: string | null;
      };
      confirm_payment_transaction: {
        Args: { p_payment_id: string; p_deal_id: string };
        Returns: string | null;
      };
      raise_dispute_transaction: {
        Args: { p_deal_id: string; p_reason: string };
        Returns: string | null;
      };
      has_active_shield: {
        Args: { p_creator_id?: string };
        Returns: boolean;
      };
      choose_shield_case_path: {
        Args: {
          p_case_id: string;
          p_path: "follow_up" | "legal";
          p_contact_brand_consent: boolean;
          p_legal_cost_acknowledged?: boolean;
          p_independent_advice_acknowledged?: boolean;
        };
        Returns: string | null;
      };
      select_shield_legal_provider: {
        Args: {
          p_case_id: string;
          p_provider_id: string;
          p_share_consent: boolean;
          p_legal_cost_acknowledged: boolean;
          p_independent_advice_acknowledged: boolean;
        };
        Returns: string | null;
      };
      confirm_shield_legal_engagement: {
        Args: { p_case_id: string };
        Returns: string | null;
      };
      withdraw_shield_provider_sharing: {
        Args: { p_case_id: string };
        Returns: string | null;
      };
      add_shield_case_update: {
        Args: {
          p_case_id: string;
          p_body: string;
          p_kind?: "follow_up" | "settlement_talk" | "legal_coordination" | "note";
          p_audience?: "creator_and_admin" | "admin_only";
        };
        Returns: string | null;
      };
      admin_update_shield_case: {
        Args: {
          p_case_id: string;
          p_status: ShieldCaseStatus;
          p_note: string;
          p_outcome?: string | null;
        };
        Returns: string | null;
      };
    };
  };
}
