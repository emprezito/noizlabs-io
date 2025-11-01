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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audio_clips: {
        Row: {
          audio_url: string | null
          category_id: string
          created_at: string
          creator_wallet: string
          id: string
          title: string
        }
        Insert: {
          audio_url?: string | null
          category_id: string
          created_at?: string
          creator_wallet: string
          id?: string
          title: string
        }
        Update: {
          audio_url?: string | null
          category_id?: string
          created_at?: string
          creator_wallet?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_clips_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          creator_wallet: string
          expires_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          creator_wallet: string
          expires_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          creator_wallet?: string
          expires_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          check_in_date: string
          created_at: string | null
          id: string
          streak_count: number
          user_wallet: string
        }
        Insert: {
          check_in_date?: string
          created_at?: string | null
          id?: string
          streak_count?: number
          user_wallet: string
        }
        Update: {
          check_in_date?: string
          created_at?: string | null
          id?: string
          streak_count?: number
          user_wallet?: string
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          categories_created: number
          clips_uploaded: number
          created_at: string | null
          id: string
          quest_date: string
          updated_at: string | null
          user_wallet: string
          votes_cast: number
        }
        Insert: {
          categories_created?: number
          clips_uploaded?: number
          created_at?: string | null
          id?: string
          quest_date?: string
          updated_at?: string | null
          user_wallet: string
          votes_cast?: number
        }
        Update: {
          categories_created?: number
          clips_uploaded?: number
          created_at?: string | null
          id?: string
          quest_date?: string
          updated_at?: string | null
          user_wallet?: string
          votes_cast?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referral_count: number | null
          referred_by: string | null
          referred_users: string[] | null
          updated_at: string
          username: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string
          referral_count?: number | null
          referred_by?: string | null
          referred_users?: string[] | null
          updated_at?: string
          username: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referral_count?: number | null
          referred_by?: string | null
          referred_users?: string[] | null
          updated_at?: string
          username?: string
          wallet_address?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string
          external_link: string | null
          id: string
          max_completions: number | null
          name: string
          points_reward: number
          task_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          external_link?: string | null
          id?: string
          max_completions?: number | null
          name: string
          points_reward?: number
          task_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          external_link?: string | null
          id?: string
          max_completions?: number | null
          name?: string
          points_reward?: number
          task_type?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          points: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          points?: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          points?: number
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          task_id: string
          user_wallet: string
          verified: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_id: string
          user_wallet: string
          verified?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_id?: string
          user_wallet?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          battle_id: string
          clip_id: string
          created_at: string
          id: string
          voter_wallet: string
        }
        Insert: {
          battle_id: string
          clip_id: string
          created_at?: string
          id?: string
          voter_wallet: string
        }
        Update: {
          battle_id?: string
          clip_id?: string
          created_at?: string
          id?: string
          voter_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "audio_clips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_points: {
        Args: { points_to_add: number; wallet: string }
        Returns: undefined
      }
      get_clip_votes: { Args: { clip_uuid: string }; Returns: number }
      verify_referral: {
        Args: { referred_wallet: string; referrer_wallet: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
