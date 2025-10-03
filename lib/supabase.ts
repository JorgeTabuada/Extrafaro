import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export interface DatabaseEmployee {
  id: string
  name: string
  type: string
  state: string
  city: string
  phone?: string
  email?: string
  notes?: string
  week_availability: Record<string, boolean>
  hour_availability: Record<
    string,
    {
      startHour: number
      endHour: number
      flexible: boolean
    }
  >
  custom_hourly_rate?: number
  created_at: string
  updated_at: string
}
