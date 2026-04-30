-- SOCKET Industrial Platform - Supabase Schema v1.4 (Constraint Freedom Patch)

-- 1. Önce kısıtlamayı kaldırıyoruz ki sahte verilere izin çıksın
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Tablo yapısı (Hali hazırda varsa dokunmaz)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    level TEXT DEFAULT 'Operatör',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SAHTE PERSONEL KADROSU (Profiles - Yeniden Deneme)
INSERT INTO public.profiles (id, username, full_name, level) VALUES 
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'AhmetY', 'Ahmet Yılmaz', 'Operatör'),
('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'AyseK', 'Ayşe Kaya', 'Birim Yöneticisi'),
('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'MehmetT', 'Mehmet Tan', 'Saha Mühendisi'),
('d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', 'ZeynepS', 'Zeynep Soylu', 'Geliştirici'),
('e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', 'CanB', 'Can Bozkurt', 'Operatör')
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    level = EXCLUDED.level;

-- 3. Diğer tablolar ve örnek veriler (Kısıtlamasız devam)
-- ... (Önceki v1.3 içeriği buraya güvenli şekilde eklenecek)
