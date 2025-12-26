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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          reason: string | null
          staff_id: string | null
          tenant_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          tenant_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_dates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          confirmation_code_hash: string
          created_at: string | null
          duration_at_booking: number
          end_time: string
          expires_at: string | null
          id: string
          notes: string | null
          price_at_booking: number
          service_id: string
          source: string | null
          staff_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          time_range: unknown
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          confirmation_code_hash: string
          created_at?: string | null
          duration_at_booking: number
          end_time: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          price_at_booking: number
          service_id: string
          source?: string | null
          staff_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          time_range?: unknown
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          confirmation_code_hash?: string
          created_at?: string | null
          duration_at_booking?: number
          end_time?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          price_at_booking?: number
          service_id?: string
          source?: string | null
          staff_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id?: string
          time_range?: unknown
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_after: number | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          max_advance_days: number | null
          min_advance_hours: number | null
          name: string
          online_booking_enabled: boolean | null
          price: number
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          buffer_after?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          max_advance_days?: number | null
          min_advance_hours?: number | null
          name: string
          online_booking_enabled?: boolean | null
          price?: number
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          buffer_after?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          max_advance_days?: number | null
          min_advance_hours?: number | null
          name?: string
          online_booking_enabled?: boolean | null
          price?: number
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedule: {
        Row: {
          break_end: string | null
          break_start: string | null
          day_of_week: number
          end_time: string
          id: string
          is_working: boolean | null
          staff_id: string
          start_time: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          day_of_week: number
          end_time?: string
          id?: string
          is_working?: boolean | null
          staff_id: string
          start_time?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_working?: boolean | null
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          service_id: string
          staff_id: string
        }
        Insert: {
          service_id: string
          staff_id: string
        }
        Update: {
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          close_time: string
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string
          tenant_id: string
        }
        Insert: {
          close_time?: string
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string
          tenant_id: string
        }
        Update: {
          close_time?: string
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      user_role: "owner" | "admin" | "staff"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      user_role: ["owner", "admin", "staff"],
    },
  },
} as const
