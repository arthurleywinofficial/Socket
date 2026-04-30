import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('Supabase credentials missing. App running in offline mode.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
