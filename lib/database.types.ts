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
      accounts: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          display_name: string
          id: string
          legacy_auth_id: string | null
          role: string
          username: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          legacy_auth_id?: string | null
          role: string
          username?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legacy_auth_id?: string | null
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      builder_books: {
        Row: {
          archived: boolean
          artwork_number: string | null
          author_id: string
          id: string
          owner_id: string
          title: string
        }
        Insert: {
          archived?: boolean
          artwork_number?: string | null
          author_id: string
          id?: string
          owner_id: string
          title: string
        }
        Update: {
          archived?: boolean
          artwork_number?: string | null
          author_id?: string
          id?: string
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "builder_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_books_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_chains: {
        Row: {
          archived: boolean
          book_chain_id: string | null
          book_id: string
          branch_route_name: string
          confirmed: boolean
          continuation: string
          id: string
          kind: string
          owner_id: string
          qari_id: string
          rawi: string
          reading_scope: string
          revision: number
          route_code: string
          title: string
          upper_route_name: string
        }
        Insert: {
          archived?: boolean
          book_chain_id?: string | null
          book_id: string
          branch_route_name?: string
          confirmed?: boolean
          continuation?: string
          id?: string
          kind: string
          owner_id: string
          qari_id?: string
          rawi?: string
          reading_scope?: string
          revision?: number
          route_code?: string
          title: string
          upper_route_name?: string
        }
        Update: {
          archived?: boolean
          book_chain_id?: string | null
          book_id?: string
          branch_route_name?: string
          confirmed?: boolean
          continuation?: string
          id?: string
          kind?: string
          owner_id?: string
          qari_id?: string
          rawi?: string
          reading_scope?: string
          revision?: number
          route_code?: string
          title?: string
          upper_route_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_chains_book_chain_id_fkey"
            columns: ["book_chain_id"]
            isOneToOne: false
            referencedRelation: "builder_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_chains_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "builder_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_chains_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_nodes: {
        Row: {
          branch: number
          chain_id: string
          person_id: string
          position: number
          route_source: boolean
          source_level: string | null
        }
        Insert: {
          branch: number
          chain_id: string
          person_id: string
          position: number
          route_source?: boolean
          source_level?: string | null
        }
        Update: {
          branch?: number
          chain_id?: string
          person_id?: string
          position?: number
          route_source?: boolean
          source_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_nodes_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "builder_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_nodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "builder_people"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_people: {
        Row: {
          archived: boolean
          display_name: string
          id: string
          name: string
          owner_id: string
          search_key: string
        }
        Insert: {
          archived?: boolean
          display_name?: string
          id?: string
          name: string
          owner_id: string
          search_key: string
        }
        Update: {
          archived?: boolean
          display_name?: string
          id?: string
          name?: string
          owner_id?: string
          search_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_people_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_person_merges: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          snapshot: Json
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          snapshot: Json
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "builder_person_merges_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_snapshots: {
        Row: {
          certificate_id: string
          content: Json
          created_at: string
        }
        Insert: {
          certificate_id: string
          content: Json
          created_at?: string
        }
        Update: {
          certificate_id?: string
          content?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_snapshots_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: true
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_subjects: {
        Row: {
          code: string
          created_at: string
          display_name: string
          kind: string
          name_key: string
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          kind: string
          name_key: string
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          kind?: string
          name_key?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          completion_date: string
          created_at: string
          draft: Json
          id: string
          issuer_id: string
          legacy_id: string | null
          recipient_account_id: string | null
          registration_number: string | null
          riwayah_code: string
          sanad_id: string | null
          status: string
          student_id: string
          verification_token: string | null
        }
        Insert: {
          completion_date: string
          created_at?: string
          draft?: Json
          id?: string
          issuer_id: string
          legacy_id?: string | null
          recipient_account_id?: string | null
          registration_number?: string | null
          riwayah_code: string
          sanad_id?: string | null
          status?: string
          student_id: string
          verification_token?: string | null
        }
        Update: {
          completion_date?: string
          created_at?: string
          draft?: Json
          id?: string
          issuer_id?: string
          legacy_id?: string | null
          recipient_account_id?: string | null
          registration_number?: string | null
          riwayah_code?: string
          sanad_id?: string | null
          status?: string
          student_id?: string
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_sanad_issuer_fk"
            columns: ["sanad_id", "issuer_id"]
            isOneToOne: false
            referencedRelation: "sanads"
            referencedColumns: ["id", "issuer_id"]
          },
          {
            foreignKeyName: "certificates_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_recipient_account_id_fkey"
            columns: ["recipient_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_sanad_id_fkey"
            columns: ["sanad_id"]
            isOneToOne: false
            referencedRelation: "sanads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_subject_code_fkey"
            columns: ["riwayah_code"]
            isOneToOne: false
            referencedRelation: "certificate_subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      issuer_accounts: {
        Row: {
          account_id: string
          issuer_id: string
        }
        Insert: {
          account_id: string
          issuer_id: string
        }
        Update: {
          account_id?: string
          issuer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issuer_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issuer_accounts_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["id"]
          },
        ]
      }
      issuers: {
        Row: {
          created_at: string
          display_name: string
          id: string
          issuer_code: string
          legacy_id: string | null
          print_profile: Json
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          issuer_code: string
          legacy_id?: string | null
          print_profile?: Json
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          issuer_code?: string
          legacy_id?: string | null
          print_profile?: Json
        }
        Relationships: []
      }
      qiraat: {
        Row: {
          display_name: string
          id: string
          legacy_id: string | null
        }
        Insert: {
          display_name: string
          id: string
          legacy_id?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          legacy_id?: string | null
        }
        Relationships: []
      }
      riwayat: {
        Row: {
          code: string
          display_name: string
          qiraah_id: string
        }
        Insert: {
          code: string
          display_name: string
          qiraah_id: string
        }
        Update: {
          code?: string
          display_name?: string
          qiraah_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_qiraah_id_fkey"
            columns: ["qiraah_id"]
            isOneToOne: false
            referencedRelation: "qiraat"
            referencedColumns: ["id"]
          },
        ]
      }
      sanads: {
        Row: {
          body: Json
          id: string
          issuer_id: string
          legacy_id: string | null
          qiraah_id: string | null
          title: string
        }
        Insert: {
          body?: Json
          id?: string
          issuer_id: string
          legacy_id?: string | null
          qiraah_id?: string | null
          title: string
        }
        Update: {
          body?: Json
          id?: string
          issuer_id?: string
          legacy_id?: string | null
          qiraah_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanads_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanads_qiraah_id_fkey"
            columns: ["qiraah_id"]
            isOneToOne: false
            referencedRelation: "qiraat"
            referencedColumns: ["id"]
          },
        ]
      }
      student_accounts: {
        Row: {
          account_id: string
          linked_at: string
          student_id: string
        }
        Insert: {
          account_id: string
          linked_at?: string
          student_id: string
        }
        Update: {
          account_id?: string
          linked_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          display_name: string
          id: string
          legacy_id: string | null
          search_name: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          legacy_id?: string | null
          search_name?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          legacy_id?: string | null
          search_name?: string | null
        }
        Relationships: []
      }
      workspace_records: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_account: {
        Args: {
          target_account: string
          target_issuer?: string
          target_role: string
        }
        Returns: undefined
      }
      attach_builder_route: {
        Args: { extra?: string; holding: Json; route_id: string }
        Returns: string
      }
      create_issuer_profile: {
        Args: { new_name: string; personal?: boolean; profile: Json }
        Returns: string
      }
      edit_account_profile: {
        Args: {
          new_active: boolean
          new_name: string
          new_role: string
          target: string
        }
        Returns: undefined
      }
      finalize_certificate: {
        Args: { certificate_id: string; snapshot: Json }
        Returns: string
      }
      full_application_backup: { Args: never; Returns: Json }
      get_account_username: { Args: never; Returns: string }
      legacy_identity_choices: { Args: never; Returns: Json }
      list_application_accounts: { Args: never; Returns: Json }
      merge_builder_people: {
        Args: { expected_token?: string; source_id: string; target_id: string }
        Returns: Json
      }
      normalize_arabic: { Args: { value: string }; Returns: string }
      read_legacy_library: {
        Args: { page_number?: number; source_name?: string }
        Returns: Json
      }
      refresh_github_artwork: {
        Args: { p_artwork: Json; p_revision: string; p_secret: string }
        Returns: Json
      }
      register_matn_subject: {
        Args: { matn_name: string; target_issuer: string }
        Returns: string
      }
      reserve_certificate_number: {
        Args: { certificate_id: string }
        Returns: string
      }
      resolve_account_username: {
        Args: { login_username: string; lookup_key: string }
        Returns: string
      }
      restore_application_backup: {
        Args: { data: Json; overwrite?: boolean }
        Returns: Json
      }
      save_account_profile: {
        Args: {
          legacy_id?: string
          new_active: boolean
          new_name: string
          new_role: string
          target: string
        }
        Returns: undefined
      }
      save_builder_chain: { Args: { record: Json }; Returns: string }
      save_personal_issuer_profile: { Args: { profile: Json }; Returns: string }
      set_account_username: { Args: { new_username: string }; Returns: string }
      set_issuer_assignment: {
        Args: { enabled: boolean; issuer: string; target: string }
        Returns: undefined
      }
      set_student_account: {
        Args: { account: string; student: string }
        Returns: undefined
      }
      verify_certificate_token: { Args: { token: string }; Returns: Json }
      verify_ijazah: { Args: { p_number: string }; Returns: Json }
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

