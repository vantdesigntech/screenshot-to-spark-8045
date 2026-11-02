export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_state: {
        Row: {
          alerts: Json
          created_at: string
          favorites: Json
          pro_demo: boolean
          search_day: string
          searches_used: number
          updated_at: string
          user_id: string
          whatsapp_alerts: boolean
        }
        Insert: {
          alerts?: Json
          created_at?: string
          favorites?: Json
          pro_demo?: boolean
          search_day?: string
          searches_used?: number
          updated_at?: string
          user_id: string
          whatsapp_alerts?: boolean
        }
        Update: {
          alerts?: Json
          created_at?: string
          favorites?: Json
          pro_demo?: boolean
          search_day?: string
          searches_used?: number
          updated_at?: string
          user_id?: string
          whatsapp_alerts?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "account_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authenticity_reviews: {
        Row: {
          created_at: string
          id: string
          internal_reasons: string
          listing_id: string
          method: string
          public_note: string
          reviewer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_reasons?: string
          listing_id: string
          method: string
          public_note?: string
          reviewer_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_reasons?: string
          listing_id?: string
          method?: string
          public_note?: string
          reviewer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "authenticity_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authenticity_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          buyer_name: string
          created_at: string
          id: string
          listing_id: string
          seller_id: string
          seller_name: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_name: string
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
          seller_name: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
          seller_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_chollos: {
        Row: {
          ai_verdict: string
          brand: string
          chollo_score: number
          condition: string
          created_at: string
          deal_type: string
          discount_pct: number
          id: string
          image: string
          location: string
          market_value_eur: number
          platform: string
          price_eur: number
          pro_only: boolean
          profit_margin_eur: number
          ref: string
          seller_note: string | null
          time_left_or_posted: string
          title: string
          url: string
        }
        Insert: {
          ai_verdict: string
          brand: string
          chollo_score: number
          condition: string
          created_at?: string
          deal_type: string
          discount_pct: number
          id: string
          image: string
          location: string
          market_value_eur: number
          platform: string
          price_eur: number
          pro_only?: boolean
          profit_margin_eur: number
          ref: string
          seller_note?: string | null
          time_left_or_posted: string
          title: string
          url: string
        }
        Update: {
          ai_verdict?: string
          brand?: string
          chollo_score?: number
          condition?: string
          created_at?: string
          deal_type?: string
          discount_pct?: number
          id?: string
          image?: string
          location?: string
          market_value_eur?: number
          platform?: string
          price_eur?: number
          pro_only?: boolean
          profit_margin_eur?: number
          ref?: string
          seller_note?: string | null
          time_left_or_posted?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          caption: string | null
          created_at: string
          file_size_bytes: number
          id: string
          is_sensitive_serial: boolean
          listing_id: string
          mime_type: string
          review_status: string
          slot_type: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_size_bytes?: number
          id?: string
          is_sensitive_serial?: boolean
          listing_id: string
          mime_type?: string
          review_status?: string
          slot_type?: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_size_bytes?: number
          id?: string
          is_sensitive_serial?: boolean
          listing_id?: string
          mime_type?: string
          review_status?: string
          slot_type?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accessories_notes: string | null
          approx_location: string
          approx_year: number | null
          authenticity_declaration: boolean
          box_included: boolean
          brand: string
          condition: string
          created_at: string
          declared_compatible_normalized: string[]
          declared_compatible_with: string[]
          description: string
          id: string
          is_demo: boolean
          known_modifications: string
          listing_type: string
          model: string
          movement_type: string
          owner_display_name: string
          owner_id: string
          owner_joined_at: string
          papers_included: boolean
          part_origin: string | null
          part_reference: string | null
          part_reference_normalized: string | null
          part_type: string | null
          price_eur: number
          published_at: string | null
          reference: string | null
          review_status: string
          search_text: string
          serial_number_masked: string | null
          serial_number_private: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accessories_notes?: string | null
          approx_location: string
          approx_year?: number | null
          authenticity_declaration?: boolean
          box_included?: boolean
          brand: string
          condition: string
          created_at?: string
          declared_compatible_normalized?: string[]
          declared_compatible_with?: string[]
          description?: string
          id?: string
          is_demo?: boolean
          known_modifications?: string
          listing_type?: string
          model: string
          movement_type: string
          owner_display_name: string
          owner_id: string
          owner_joined_at?: string
          papers_included?: boolean
          part_origin?: string | null
          part_reference?: string | null
          part_reference_normalized?: string | null
          part_type?: string | null
          price_eur: number
          published_at?: string | null
          reference?: string | null
          review_status?: string
          search_text?: string
          serial_number_masked?: string | null
          serial_number_private?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accessories_notes?: string | null
          approx_location?: string
          approx_year?: number | null
          authenticity_declaration?: boolean
          box_included?: boolean
          brand?: string
          condition?: string
          created_at?: string
          declared_compatible_normalized?: string[]
          declared_compatible_with?: string[]
          description?: string
          id?: string
          is_demo?: boolean
          known_modifications?: string
          listing_type?: string
          model?: string
          movement_type?: string
          owner_display_name?: string
          owner_id?: string
          owner_joined_at?: string
          papers_included?: boolean
          part_origin?: string | null
          part_reference?: string | null
          part_reference_normalized?: string | null
          part_type?: string | null
          price_eur?: number
          published_at?: string | null
          reference?: string | null
          review_status?: string
          search_text?: string
          serial_number_masked?: string | null
          serial_number_private?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_moderators: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_name: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          alert_id: string | null
          created_at: string
          id: string
          kind: string
          listing_id: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          id?: string
          kind: string
          listing_id?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          listing_id?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "search_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_part_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalog: {
        Row: {
          brand: string
          category: string
          compatible_with: string[]
          created_at: string
          custom_url: string | null
          delivery: string
          equivalent_oem_price_eur: number | null
          id: string
          image: string
          oem_ref: string | null
          origin: string
          pair_group_id: string | null
          price_eur: number
          pro_only: boolean
          spec: string
          store: string
          title: string
        }
        Insert: {
          brand: string
          category: string
          compatible_with?: string[]
          created_at?: string
          custom_url?: string | null
          delivery?: string
          equivalent_oem_price_eur?: number | null
          id: string
          image: string
          oem_ref?: string | null
          origin: string
          pair_group_id?: string | null
          price_eur: number
          pro_only?: boolean
          spec: string
          store: string
          title: string
        }
        Update: {
          brand?: string
          category?: string
          compatible_with?: string[]
          created_at?: string
          custom_url?: string | null
          delivery?: string
          equivalent_oem_price_eur?: number | null
          id?: string
          image?: string
          oem_ref?: string | null
          origin?: string
          pair_group_id?: string | null
          price_eur?: number
          pro_only?: boolean
          spec?: string
          store?: string
          title?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          client_session_id: string | null
          created_at: string
          id: string
          part_id: string
          target_eur: number
          title: string
          user_id: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          client_session_id?: string | null
          created_at?: string
          id?: string
          part_id: string
          target_eur: number
          title: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          client_session_id?: string | null
          created_at?: string
          id?: string
          part_id?: string
          target_eur?: number
          title?: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      search_alerts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          query: string
          query_tokens: string[]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          query: string
          query_tokens?: string[]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          query?: string
          query_tokens?: string[]
          user_id?: string
        }
        Relationships: []
      }
      seo_articles: {
        Row: {
          category: string
          excerpt: string
          faq: Json
          keywords: string[]
          meta_description: string
          meta_title: string
          published_at: string
          read_time: string
          related_model_id: string
          related_search_query: string
          sections: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          excerpt: string
          faq?: Json
          keywords?: string[]
          meta_description: string
          meta_title: string
          published_at?: string
          read_time: string
          related_model_id: string
          related_search_query: string
          sections?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          excerpt?: string
          faq?: Json
          keywords?: string[]
          meta_description?: string
          meta_title?: string
          published_at?: string
          read_time?: string
          related_model_id?: string
          related_search_query?: string
          sections?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      watchbox_favorites: {
        Row: {
          client_session_id: string | null
          created_at: string
          id: string
          part_id: string
          part_title: string
          price_eur: number
          store: string
          user_id: string | null
        }
        Insert: {
          client_session_id?: string | null
          created_at?: string
          id?: string
          part_id: string
          part_title: string
          price_eur: number
          store: string
          user_id?: string | null
        }
        Update: {
          client_session_id?: string | null
          created_at?: string
          id?: string
          part_id?: string
          part_title?: string
          price_eur?: number
          store?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_part_listings: {
        Row: {
          approx_location: string | null
          brand: string | null
          condition: string | null
          created_at: string | null
          declared_compatible_normalized: string[] | null
          declared_compatible_with: string[] | null
          description: string | null
          id: string | null
          model: string | null
          owner_display_name: string | null
          part_origin: string | null
          part_reference: string | null
          part_reference_normalized: string | null
          part_type: string | null
          price_eur: number | null
          published_at: string | null
          search_text: string | null
        }
        Insert: {
          approx_location?: string | null
          brand?: string | null
          condition?: string | null
          created_at?: string | null
          declared_compatible_normalized?: string[] | null
          declared_compatible_with?: string[] | null
          description?: string | null
          id?: string | null
          model?: string | null
          owner_display_name?: string | null
          part_origin?: string | null
          part_reference?: string | null
          part_reference_normalized?: string | null
          part_type?: string | null
          price_eur?: number | null
          published_at?: string | null
          search_text?: string | null
        }
        Update: {
          approx_location?: string | null
          brand?: string | null
          condition?: string | null
          created_at?: string | null
          declared_compatible_normalized?: string[] | null
          declared_compatible_with?: string[] | null
          description?: string | null
          id?: string | null
          model?: string | null
          owner_display_name?: string | null
          part_origin?: string | null
          part_reference?: string | null
          part_reference_normalized?: string | null
          part_type?: string | null
          price_eur?: number | null
          published_at?: string | null
          search_text?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_marketplace_moderator: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      normalize_token: { Args: { input: string }; Returns: string }
      part_type_label: { Args: { p: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
