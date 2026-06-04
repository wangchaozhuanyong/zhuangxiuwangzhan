export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ContentStatus = "draft" | "published" | "archived";
export type LeadStatus = "new" | "contacted" | "site_visit_scheduled" | "quoted" | "converted" | "closed" | "spam";
export type QuoteStatus = "pending" | "contacted" | "site_visit_scheduled" | "quoted" | "accepted" | "rejected" | "closed";
export type TranslationStatus = "queued" | "processing" | "completed" | "failed";
export type AdminRole = "super_admin" | "content_editor" | "lead_manager" | "viewer";

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

type Timestamp = string;
type DateString = string;

type ContentAuditColumns = {
  version: number;
};

export type Database = {
  public: {
    Tables: {
      [key: string]: Table<any>;
      about_sections: Table<
        ContentAuditColumns & {
          id: string;
          section_key: string;
          title_zh: string | null;
          title_en: string | null;
          subtitle_zh: string | null;
          subtitle_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          image_url: string | null;
          items_zh: Json;
          items_en: Json;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      admin_audit_logs: Table<{
        id: string;
        admin_user_id: string | null;
        action: string | null;
        table_name: string | null;
        record_id: string | null;
        old_value: Json | null;
        new_value: Json | null;
        created_at: Timestamp | null;
      }>;
      admin_users: Table<{
        user_id: string;
        email: string;
        active: boolean | null;
        role: AdminRole;
        created_at: Timestamp | null;
        updated_at: Timestamp;
        version: number;
      }>;
      before_after_items: Table<
        ContentAuditColumns & {
          id: string;
          title_zh: string | null;
          title_en: string | null;
          location: string | null;
          description_zh: string | null;
          description_en: string | null;
          before_image_url: string | null;
          after_image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      blog_posts: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          category: string | null;
          tags: string[] | null;
          cover_image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          published_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      brand_partners: Table<
        ContentAuditColumns & {
          id: string;
          name: string;
          logo_url: string;
          website_url: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      cms_content_entries: Table<{
        id: string;
        content_type: string;
        slug: string;
        title_zh: string | null;
        title_en: string | null;
        excerpt_zh: string | null;
        excerpt_en: string | null;
        content_zh: string | null;
        content_en: string | null;
        data_zh: Json;
        data_en: Json;
        media: Json;
        status: ContentStatus;
        sort_order: number;
        version: number;
        deleted_at: Timestamp | null;
        published_at: Timestamp | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      cms_pages: Table<{
        id: string;
        page_key: string;
        path: string;
        title_zh: string | null;
        title_en: string | null;
        seo_title_zh: string | null;
        seo_title_en: string | null;
        seo_description_zh: string | null;
        seo_description_en: string | null;
        seo_keywords_zh: string | null;
        seo_keywords_en: string | null;
        status: ContentStatus;
        sort_order: number;
        version: number;
        deleted_at: Timestamp | null;
        published_at: Timestamp | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      cms_revisions: Table<{
        id: string;
        entity_table: "cms_pages" | "cms_sections" | "cms_content_entries";
        entity_id: string;
        action: "insert" | "update" | "delete" | "restore";
        version: number | null;
        snapshot: Json;
        created_by: string | null;
        created_at: Timestamp;
      }>;
      cms_section_templates: Table<{
        id: string;
        template_key: string;
        label: string;
        description: string | null;
        schema: Json;
        default_content_zh: Json;
        default_content_en: Json;
        status: ContentStatus;
        sort_order: number;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      cms_sections: Table<{
        id: string;
        page_id: string;
        section_key: string;
        section_type: string;
        title_zh: string | null;
        title_en: string | null;
        content_zh: Json;
        content_en: Json;
        settings: Json;
        status: ContentStatus;
        sort_order: number;
        version: number;
        deleted_at: Timestamp | null;
        published_at: Timestamp | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      cta_blocks: Table<
        ContentAuditColumns & {
          id: string;
          block_key: string;
          title_zh: string | null;
          title_en: string | null;
          description_zh: string | null;
          description_en: string | null;
          primary_label_zh: string | null;
          primary_label_en: string | null;
          primary_url: string | null;
          secondary_label_zh: string | null;
          secondary_label_en: string | null;
          secondary_url: string | null;
          image_url: string | null;
          status: ContentStatus | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      faqs: Table<
        ContentAuditColumns & {
          id: string;
          page_key: string | null;
          question_zh: string | null;
          question_en: string | null;
          answer_zh: string | null;
          answer_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      form_submission_attempts: Table<{
        id: string;
        form_type: string;
        ip_hash: string;
        phone_hash: string | null;
        created_at: Timestamp;
      }>;
      hero_slides: Table<{
        id: string;
        title_zh: string | null;
        title_en: string | null;
        excerpt_zh: string | null;
        excerpt_en: string | null;
        button_label_zh: string | null;
        button_label_en: string | null;
        button_url: string | null;
        image_url: string | null;
        alt_zh: string | null;
        alt_en: string | null;
        status: ContentStatus | null;
        sort_order: number | null;
        created_at: Timestamp | null;
        updated_at: Timestamp | null;
      }>;
      home_sections: Table<
        ContentAuditColumns & {
          id: string;
          section_key: string;
          title_zh: string | null;
          title_en: string | null;
          subtitle_zh: string | null;
          subtitle_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          image_url: string | null;
          button_label_zh: string | null;
          button_label_en: string | null;
          button_url: string | null;
          items_zh: Json;
          items_en: Json;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      landing_pages: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          hero_image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          benefits_zh: string[] | null;
          benefits_en: string[] | null;
          related_projects: Json;
          faqs_zh: Json;
          faqs_en: Json;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      lead_followups: Table<{
        id: string;
        lead_id: string | null;
        quote_request_id: string | null;
        followup_type: string | null;
        content: string | null;
        next_follow_up_at: Timestamp | null;
        created_by: string | null;
        created_at: Timestamp | null;
      }>;
      leads: Table<
        ContentAuditColumns & {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          project_type: string | null;
          location: string | null;
          message: string;
          source: string | null;
          source_path: string | null;
          status: LeadStatus | null;
          notes: string | null;
          next_follow_up_at: Timestamp | null;
          closed_at: Timestamp | null;
          lost_reason: string | null;
          deal_value: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      maintenance_reminder_items: Table<{
        id: string;
        category: string;
        title: string;
        description: string;
        frequency: "weekly" | "monthly";
        sort_order: number;
        active: boolean;
        created_at: Timestamp | null;
        updated_at: Timestamp | null;
      }>;
      materials: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          category: string | null;
          subcategory: string | null;
          material_type: string | null;
          color: string | null;
          texture: string | null;
          suitable_spaces_zh: string[] | null;
          suitable_spaces_en: string[] | null;
          pros_zh: string[] | null;
          pros_en: string[] | null;
          cons_zh: string[] | null;
          cons_en: string[] | null;
          recommended_pairing_zh: string | null;
          recommended_pairing_en: string | null;
          note_zh: string | null;
          note_en: string | null;
          reference_price: string | null;
          related_project_ids: string[] | null;
          image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      media_assets: Table<
        ContentAuditColumns & {
          id: string;
          file_url: string;
          file_path: string | null;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          poster_url: string | null;
          duration_seconds: number | null;
          original_file_path: string | null;
          original_mime_type: string | null;
          original_size_bytes: number | null;
          original_width: number | null;
          original_height: number | null;
          processing_status: string;
          folder: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          usage_type: string | null;
          created_by: string | null;
          created_at: Timestamp | null;
        }
      >;
      notification_settings: Table<{
        id: "default";
        telegram_enabled: boolean;
        telegram_bot_token: string | null;
        telegram_chat_id: string | null;
        maintenance_reminders_enabled: boolean;
        maintenance_reminder_day: string;
        maintenance_reminder_time: string;
        maintenance_timezone: string;
        maintenance_last_sent_at: Timestamp | null;
        created_at: Timestamp | null;
        updated_at: Timestamp | null;
      }>;
      process_steps: Table<
        ContentAuditColumns & {
          id: string;
          step_number: number;
          title_zh: string | null;
          title_en: string | null;
          description_zh: string | null;
          description_en: string | null;
          icon_key: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      project_images: Table<{
        id: string;
        project_id: string | null;
        image_url: string;
        image_type: "gallery" | "before" | "after" | "cover" | null;
        alt_zh: string | null;
        alt_en: string | null;
        sort_order: number | null;
        created_at: Timestamp | null;
      }>;
      projects: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          image_url: string | null;
          location: string | null;
          area: string | null;
          duration: string | null;
          budget: string | null;
          project_type: string | null;
          materials: string[] | null;
          scope: string[] | null;
          highlights_zh: string[] | null;
          highlights_en: string[] | null;
          client_need_zh: string | null;
          client_need_en: string | null;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      quote_requests: Table<
        ContentAuditColumns & {
          id: string;
          lead_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          project_type: string;
          location: string;
          property_size: string | null;
          project_details: string | null;
          attachments: string[] | null;
          estimated_budget: string | null;
          quoted_amount: number | null;
          valid_until: DateString | null;
          source_path: string | null;
          status: QuoteStatus | null;
          notes: string | null;
          lost_reason: string | null;
          closed_at: Timestamp | null;
          next_follow_up_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      service_areas: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          area_name: string | null;
          property_types: string[] | null;
          common_needs: string[] | null;
          construction_notes_zh: string | null;
          construction_notes_en: string | null;
          projects: Json;
          faqs_zh: Json;
          faqs_en: Json;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      services: Table<
        ContentAuditColumns & {
          id: string;
          slug: string;
          title_zh: string | null;
          title_en: string | null;
          excerpt_zh: string | null;
          excerpt_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          suitable_for_zh: string[] | null;
          suitable_for_en: string[] | null;
          common_projects_zh: string[] | null;
          common_projects_en: string[] | null;
          process_steps_zh: Json;
          process_steps_en: Json;
          scope_items_zh: string[] | null;
          scope_items_en: string[] | null;
          faqs_zh: Json;
          faqs_en: Json;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      site_pages: Table<
        ContentAuditColumns & {
          id: string;
          page_key: string;
          path: string;
          title_zh: string | null;
          title_en: string | null;
          subtitle_zh: string | null;
          subtitle_en: string | null;
          description_zh: string | null;
          description_en: string | null;
          content_zh: string | null;
          content_en: string | null;
          cta_title_zh: string | null;
          cta_title_en: string | null;
          cta_description_zh: string | null;
          cta_description_en: string | null;
          image_url: string | null;
          alt_zh: string | null;
          alt_en: string | null;
          seo_title_zh: string | null;
          seo_title_en: string | null;
          seo_description_zh: string | null;
          seo_description_en: string | null;
          seo_keywords_zh: string | null;
          seo_keywords_en: string | null;
          items_zh: Json;
          items_en: Json;
          status: ContentStatus | null;
          sort_order: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      site_settings: Table<
        ContentAuditColumns & {
          id: "default";
          company_name: string | null;
          brand_name: string | null;
          ssm_number: string | null;
          email: string | null;
          phone_display: string | null;
          phone_e164: string | null;
          whatsapp_number: string | null;
          address_zh: string | null;
          address_en: string | null;
          short_address_zh: string | null;
          short_address_en: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          xiaohongshu_url: string | null;
          linkedin_url: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          og_image_url: string | null;
          map_latitude: string | null;
          map_longitude: string | null;
          default_seo_title_zh: string | null;
          default_seo_title_en: string | null;
          default_seo_description_zh: string | null;
          default_seo_description_en: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        }
      >;
      system_event_logs: Table<{
        id: string;
        event_type: string;
        severity: "debug" | "info" | "warn" | "error" | "critical";
        source: string;
        message: string;
        metadata: Json;
        actor_id: string | null;
        created_at: Timestamp;
      }>;
      testimonials: Table<{
        id: string;
        project_id: string | null;
        customer_name: string | null;
        rating: number | null;
        content_zh: string | null;
        content_en: string | null;
        status: ContentStatus | null;
        sort_order: number | null;
        created_at: Timestamp | null;
        updated_at: Timestamp | null;
      }>;
      translation_jobs: Table<{
        id: string;
        table_name: string;
        record_id: string;
        status: TranslationStatus | null;
        error_message: string | null;
        regenerated_at: Timestamp | null;
        created_at: Timestamp | null;
        updated_at: Timestamp | null;
      }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_role: {
        Args: Record<PropertyKey, never>;
        Returns: AdminRole | null;
      };
      has_admin_role: {
        Args: {
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      get_public_home_bundle: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      content_status: ContentStatus;
      lead_status: LeadStatus;
      quote_status: QuoteStatus;
      translation_status: TranslationStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type SupabaseTableName = keyof Database["public"]["Tables"];
export type SupabaseTableRow<TableName extends SupabaseTableName> = Database["public"]["Tables"][TableName]["Row"];
export type SupabaseTableInsert<TableName extends SupabaseTableName> = Database["public"]["Tables"][TableName]["Insert"];
export type SupabaseTableUpdate<TableName extends SupabaseTableName> = Database["public"]["Tables"][TableName]["Update"];
