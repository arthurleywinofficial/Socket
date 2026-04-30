import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🛡️ AKILLI KORUMA: Anahtarlar yoksa uygulamayı kilitlemeyen sahte bir istemci döndür
const createSafeClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
    console.warn('Supabase credentials missing. Running in MOCK mode.')
    return {
      auth: {
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase Not Configured' } }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase Not Configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          insert: () => Promise.resolve({ data: null, error: null })
        })
      })
    } as any
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSafeClient()
