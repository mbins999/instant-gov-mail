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
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_comments: {
        Row: {
          attachments: string[] | null
          comment: string
          correspondence_id: string | null
          created_at: string | null
          id: string
          is_edited: boolean | null
          is_internal: boolean | null
          mentioned_users: number[] | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          attachments?: string[] | null
          comment: string
          correspondence_id?: string | null
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentioned_users?: number[] | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          attachments?: string[] | null
          comment?: string
          correspondence_id?: string | null
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentioned_users?: number[] | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_comments_correspondence_id_fkey"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "correspondence_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_correspondence"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_parent"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "correspondence_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_templates: {
        Row: {
          category: string | null
          content_template: string
          created_at: string | null
          created_by: number | null
          entity_id: string | null
          greeting: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          subject_template: string | null
          type: string | null
          updated_at: string | null
          updated_by: number | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content_template: string
          created_at?: string | null
          created_by?: number | null
          entity_id?: string | null
          greeting?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          subject_template?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: number | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content_template?: string
          created_at?: string | null
          created_by?: number | null
          entity_id?: string | null
          greeting?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          subject_template?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: number | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_templates_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_templates_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_templates_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondences: {
        Row: {
          archived: boolean | null
          attachments: string[] | null
          content: string
          created_at: string | null
          created_by: number | null
          date: string
          display_type: string
          external_connection_id: string | null
          external_doc_id: string | null
          from_entity: string
          greeting: string
          id: string
          notes: string | null
          number: string
          pdf_url: string | null
          received_at: string | null
          received_by: number | null
          received_by_entity: string | null
          responsible_person: string | null
          signature_url: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          attachments?: string[] | null
          content: string
          created_at?: string | null
          created_by?: number | null
          date?: string
          display_type?: string
          external_connection_id?: string | null
          external_doc_id?: string | null
          from_entity: string
          greeting?: string
          id?: string
          notes?: string | null
          number: string
          pdf_url?: string | null
          received_at?: string | null
          received_by?: number | null
          received_by_entity?: string | null
          responsible_person?: string | null
          signature_url?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          created_by?: number | null
          date?: string
          display_type?: string
          external_connection_id?: string | null
          external_doc_id?: string | null
          from_entity?: string
          greeting?: string
          id?: string
          notes?: string | null
          number?: string
          pdf_url?: string | null
          received_at?: string | null
          received_by?: number | null
          received_by_entity?: string | null
          responsible_person?: string | null
          signature_url?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondences_external_connection_id_fkey"
            columns: ["external_connection_id"]
            isOneToOne: false
            referencedRelation: "external_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondences_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondences_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_correspondences_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_correspondences_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_correspondences_external_connection"
            columns: ["external_connection_id"]
            isOneToOne: false
            referencedRelation: "external_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_correspondences_received_by"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_correspondences_received_by"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      external_connections: {
        Row: {
          api_token: string | null
          base_url: string
          created_at: string
          created_by: number | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          name: string
          password_encrypted: string
          session_expires_at: string | null
          session_token: string | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          api_token?: string | null
          base_url: string
          created_at?: string
          created_by?: number | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          password_encrypted: string
          session_expires_at?: string | null
          session_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          api_token?: string | null
          base_url?: string
          created_at?: string
          created_by?: number | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          password_encrypted?: string
          session_expires_at?: string | null
          session_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connections_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connections_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          correspondence_id: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: number | null
        }
        Insert: {
          action_url?: string | null
          correspondence_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id?: number | null
        }
        Update: {
          action_url?: string | null
          correspondence_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_correspondence"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notifications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notifications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_correspondence_id_fkey"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_password_history_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_password_history_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_log: {
        Row: {
          connection_id: string | null
          correspondence_id: string | null
          created_at: string
          error_message: string | null
          external_doc_id: string | null
          id: string
          operation: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          connection_id?: string | null
          correspondence_id?: string | null
          created_at?: string
          error_message?: string | null
          external_doc_id?: string | null
          id?: string
          operation: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
        }
        Update: {
          connection_id?: string | null
          correspondence_id?: string | null
          created_at?: string
          error_message?: string | null
          external_doc_id?: string | null
          id?: string
          operation?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sync_log_connection"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "external_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sync_log_correspondence"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "external_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_log_correspondence_id_fkey"
            columns: ["correspondence_id"]
            isOneToOne: false
            referencedRelation: "correspondences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          created_by: number | null
          entity_id: string | null
          entity_name: string | null
          full_name: string
          id: number
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          entity_id?: string | null
          entity_name?: string | null
          full_name: string
          id?: number
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          entity_id?: string | null
          entity_name?: string | null
          full_name?: string
          id?: number
          password_hash?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      correspondence_statistics: {
        Row: {
          archived_count: number | null
          attachment_only_count: number | null
          avg_hours_to_receive: number | null
          from_entity: string | null
          month: string | null
          received_by_entity: string | null
          received_count: number | null
          total_count: number | null
          type: string | null
          with_content_count: number | null
          with_signature_count: number | null
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          active_users: number | null
          correspondences_created: number | null
          correspondences_updated: number | null
          correspondences_viewed: number | null
          date: string | null
          logins: number | null
        }
        Relationships: []
      }
      entity_statistics: {
        Row: {
          id: string | null
          name: string | null
          received_count: number | null
          sent_count: number | null
          templates_count: number | null
          total_correspondences: number | null
          type: string | null
          users_count: number | null
        }
        Relationships: []
      }
      user_performance: {
        Row: {
          avg_response_hours: number | null
          comments_count: number | null
          created_count: number | null
          entity_name: string | null
          full_name: string | null
          id: number | null
          last_activity: string | null
          received_count: number | null
          role: Database["public"]["Enums"]["app_role"] | null
          total_correspondences: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_correspondence_id?: string
          p_message: string
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: number
        }
        Returns: string
      }
      get_user_by_username: { Args: { username_input: string }; Returns: Json }
      get_user_id_from_session: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: number
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: string
          p_description?: string
          p_entity_id: string
          p_entity_type: string
          p_new_data?: Json
          p_old_data?: Json
          p_user_id: number
        }
        Returns: string
      }
      set_password_hash: {
        Args: { password_hash_input: string; user_id_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
