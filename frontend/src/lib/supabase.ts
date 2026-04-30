import { createClient } from '@supabase/supabase-js'

// 🛡️ KESİN ÇÖZÜM: Vercel ortam değişkenleri bazen derleme sırasında gecikebilir.
// Bu yüzden anahtarları doğrudan buraya mühürlüyoruz. v1.7.3
const supabaseUrl = 'https://yislfzdxipwciaurgnbu.supabase.co'
const supabaseAnonKey = 'sb_publishable_wCN3qpn26EqSdxnssTppmw_WCRRaMzT'

// 🛡️ AKILLI KORUMA: Eğer anahtarlar bir şekilde yanlışsa veya eksikse çökmemesi için
const createSafeClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
    console.warn('Supabase credentials missing. Running in MOCK mode.')
    return {
      auth: {
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase Not Configured' } }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase Not Configured' } }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async (options: any) => { 
          alert(`Supabase henüz yapılandırılmamış. ${options.provider} girişi için lütfen anahtarları kontrol edin.`);
          return { data: { url: null }, error: { message: 'Supabase Not Configured' } };
        },
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
