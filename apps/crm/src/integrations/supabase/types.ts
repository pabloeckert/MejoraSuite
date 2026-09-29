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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          assigned_to: string | null
          channel: string | null
          company: string | null
          contact_name: string | null
          country: string
          created_at: string
          email: string | null
          first_contact_date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          province: string | null
          segment: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          contact_name?: string | null
          country?: string
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          province?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          contact_name?: string | null
          country?: string
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          province?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      interaction_lines: {
        Row: {
          created_at: string
          id: string
          interaction_id: string
          line_total: number
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_id: string
          line_total?: number
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          interaction_id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "interaction_lines_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          attachment_url: string | null
          client_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"] | null
          estimated_loss: number | null
          follow_up_date: string | null
          followup_motive: string | null
          followup_scenario:
            | Database["public"]["Enums"]["followup_scenario"]
            | null
          historic_quote_amount: number | null
          historic_quote_date: string | null
          id: string
          interaction_date: string
          loss_reason: string | null
          medium: Database["public"]["Enums"]["interaction_medium"]
          negotiation_state:
            | Database["public"]["Enums"]["negotiation_state"]
            | null
          next_step: string | null
          notes: string | null
          quote_path: Database["public"]["Enums"]["quote_path"] | null
          reference_quote_id: string | null
          result: Database["public"]["Enums"]["interaction_result"]
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          client_id: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          estimated_loss?: number | null
          follow_up_date?: string | null
          followup_motive?: string | null
          followup_scenario?:
            | Database["public"]["Enums"]["followup_scenario"]
            | null
          historic_quote_amount?: number | null
          historic_quote_date?: string | null
          id?: string
          interaction_date?: string
          loss_reason?: string | null
          medium: Database["public"]["Enums"]["interaction_medium"]
          negotiation_state?:
            | Database["public"]["Enums"]["negotiation_state"]
            | null
          next_step?: string | null
          notes?: string | null
          quote_path?: Database["public"]["Enums"]["quote_path"] | null
          reference_quote_id?: string | null
          result: Database["public"]["Enums"]["interaction_result"]
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          client_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          estimated_loss?: number | null
          follow_up_date?: string | null
          followup_motive?: string | null
          followup_scenario?:
            | Database["public"]["Enums"]["followup_scenario"]
            | null
          historic_quote_amount?: number | null
          historic_quote_date?: string | null
          id?: string
          interaction_date?: string
          loss_reason?: string | null
          medium?: Database["public"]["Enums"]["interaction_medium"]
          negotiation_state?:
            | Database["public"]["Enums"]["negotiation_state"]
            | null
          next_step?: string | null
          notes?: string | null
          quote_path?: Database["public"]["Enums"]["quote_path"] | null
          reference_quote_id?: string | null
          result?: Database["public"]["Enums"]["interaction_result"]
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_reference_quote_id_fkey"
            columns: ["reference_quote_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          id: string
          name: string
          price: number | null
          unit: string
          unit_label: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          id?: string
          name: string
          price?: number | null
          unit?: string
          unit_label?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          unit?: string
          unit_label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_seller_ranking: {
        Row: {
          user_id: string
          full_name: string | null
          period_start: string
          ventas_count: number
          presupuestos_count: number
          seguimientos_count: number
          rechazos_count: number
          total_interactions: number
          ingresos: number
          pipeline: number
        }
      }
      mv_client_summary: {
        Row: {
          client_id: string
          name: string
          company: string | null
          segment: string | null
          province: string | null
          status: Database["public"]["Enums"]["client_status"]
          assigned_to: string | null
          client_created_at: string
          last_interaction_date: string | null
          last_result: Database["public"]["Enums"]["interaction_result"] | null
          last_medium: Database["public"]["Enums"]["interaction_medium"] | null
          total_interactions: number
          total_ventas: number
          total_presupuestos: number
          days_since_last_interaction: number | null
        }
      }
    }
    Functions: {
      calculate_client_status: {
        Args: { _client_id: string }
        Returns: Database["public"]["Enums"]["client_status"]
      }
      get_dashboard_data: {
        Args: Record<string, never>
        Returns: Json
      }
      get_notifications_data: {
        Args: Record<string, never>
        Returns: Json
      }
      get_seller_ranking: {
        Args: { period_start: string }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_materialized_views: {
        Args: Record<string, never>
        Returns: undefined
      }
      request_account_deletion: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "vendedor"
      client_status: "activo" | "potencial" | "inactivo"
      currency_code: "ARS" | "USD" | "EUR"
      followup_scenario: "vinculado" | "independiente" | "historico"
      interaction_medium:
        | "whatsapp"
        | "llamada"
        | "email"
        | "reunion_presencial"
        | "reunion_virtual"
        | "md_instagram"
        | "md_facebook"
        | "md_linkedin"
        | "visita_campo"
      interaction_result:
        | "presupuesto"
        | "venta"
        | "seguimiento"
        | "sin_respuesta"
        | "no_interesado"
      negotiation_state:
        | "con_interes"
        | "sin_respuesta"
        | "revisando"
        | "pidio_cambios"
      quote_path: "catalogo" | "adjunto"
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
      app_role: ["admin", "supervisor", "vendedor"],
      client_status: ["activo", "potencial", "inactivo"],
      currency_code: ["ARS", "USD", "EUR"],
      followup_scenario: ["vinculado", "independiente", "historico"],
      interaction_medium: [
        "whatsapp",
        "llamada",
        "email",
        "reunion_presencial",
        "reunion_virtual",
        "md_instagram",
        "md_facebook",
        "md_linkedin",
        "visita_campo",
      ],
      interaction_result: [
        "presupuesto",
        "venta",
        "seguimiento",
        "sin_respuesta",
        "no_interesado",
      ],
      negotiation_state: [
        "con_interes",
        "sin_respuesta",
        "revisando",
        "pidio_cambios",
      ],
      quote_path: ["catalogo", "adjunto"],
    },
  },
} as const
