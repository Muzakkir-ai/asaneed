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
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          legacy_auth_id?: string | null
          role: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legacy_auth_id?: string | null
          role?: string
        }
        Relationships: []
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
            foreignKeyName: "certificates_riwayah_code_fkey"
            columns: ["riwayah_code"]
            isOneToOne: false
            referencedRelation: "riwayat"
            referencedColumns: ["code"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_certificate: {
        Args: { certificate_id: string; snapshot: Json }
        Returns: string
      }
      normalize_arabic: { Args: { value: string }; Returns: string }
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

