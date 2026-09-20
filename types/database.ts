export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_types: {
        Row: {
          id: string
          name: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: Json
          created_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          business_type_id: string | null
          name: string
          slug: string
          description: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          logo_path: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_type_id?: string | null
          name: string
          slug: string
          description?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          logo_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_type_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          logo_path?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      menu_sections: {
        Row: {
          id: string
          business_id: string
          name: Json
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: Json
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: Json
          sort_order?: number
        }
      }
      menu_items: {
        Row: {
          id: string
          business_id: string
          menu_section_id: string | null
          name: Json
          description: Json | null
          price: number | null
          image_path: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          menu_section_id?: string | null
          name: Json
          description?: Json | null
          price?: number | null
          image_path?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          menu_section_id?: string | null
          name?: Json
          description?: Json | null
          price?: number | null
          image_path?: string | null
          sort_order?: number
          updated_at?: string
        }
      }
      menu_item_comments: {
        Row: {
          id: string
          menu_item_id: string
          user_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          menu_item_id: string
          user_id: string
          body: string
          created_at?: string
        }
        Update: {
          body?: string
        }
      }
      user_favorite_menu_items: {
        Row: {
          user_id: string
          menu_item_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          menu_item_id: string
          created_at?: string
        }
        Update: never
      }
      tables: {
        Row: {
          id: string
          business_id: string
          name: string
          token: string
          capacity: number | null
          section: string | null
          status: 'available' | 'occupied' | 'reserved' | 'needs_cleaning'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          token?: string
          capacity?: number | null
          section?: string | null
          status?: 'available' | 'occupied' | 'reserved' | 'needs_cleaning'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          capacity?: number | null
          section?: string | null
          status?: 'available' | 'occupied' | 'reserved' | 'needs_cleaning'
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      owned_business_ids: {
        Args: Record<never, never>
        Returns: string[]
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience types
export type Business = Database['public']['Tables']['businesses']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuSection = Database['public']['Tables']['menu_sections']['Row']
export type MenuItemComment = Database['public']['Tables']['menu_item_comments']['Row']
export type BusinessType = Database['public']['Tables']['business_types']['Row']
export type Table = Database['public']['Tables']['tables']['Row']

// Translatable JSONB helper
export type TranslatableText = {
  en?: string
  ja?: string
  zh?: string
  ko?: string
  fr?: string
  de?: string
  es?: string
  it?: string
  pt?: string
  ar?: string
  hi?: string
  th?: string
  vi?: string
  id?: string
  ms?: string
  [key: string]: string | undefined
}

// Extended types with joins
export type BusinessWithType = Business & {
  business_types: BusinessType | null
}

export type MenuItemWithSection = MenuItem & {
  menu_sections: MenuSection | null
}

export type MenuItemWithComments = MenuItem & {
  menu_item_comments: (MenuItemComment & {
    profiles?: { display_name: string | null } | null
  })[]
}

export type FullBusiness = Business & {
  business_types: BusinessType | null
  menu_sections: (MenuSection & {
    menu_items: MenuItemWithComments[]
  })[]
  unsectioned_items: MenuItemWithComments[]
}
