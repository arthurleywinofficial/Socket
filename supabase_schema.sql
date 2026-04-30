-- SOCKET Industrial Platform - Supabase Schema v1.3 (Fake Data & Staff Deployment)

-- 1. Tablolar (Zaten Varsa Atlar)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- FK kısıtlamasını test verisi için esnetiyoruz
    username TEXT UNIQUE,
    full_name TEXT,
    level TEXT DEFAULT 'Operatör',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SAHTE PERSONEL KADROSU (Profiles)
INSERT INTO public.profiles (id, username, full_name, level) VALUES 
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'AhmetY', 'Ahmet Yılmaz', 'Operatör'),
('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'AyseK', 'Ayşe Kaya', 'Birim Yöneticisi'),
('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'MehmetT', 'Mehmet Tan', 'Saha Mühendisi'),
('d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', 'ZeynepS', 'Zeynep Soylu', 'Geliştirici'),
('e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', 'CanB', 'Can Bozkurt', 'Operatör')
ON CONFLICT (id) DO NOTHING;

-- SAHTE SİSTEM LOGLARI (Personellerle İlişkili)
INSERT INTO public.system_logs (type, message, source, user_id) VALUES 
('INFO', 'AhmetY sisteme giriş yaptı.', 'AuthService', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('WARNING', 'Ceyhan Terminali basınç uyarısı inceleniyor.', 'FieldReport', 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f'),
('INFO', 'Vaftiz-1 ünitesi bakımı tamamlandı.', 'Maintenance', 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e'),
('CRITICAL', 'Güvenlik protokolü v2.1 güncellendi.', 'Security', 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a')
ON CONFLICT DO NOTHING;

-- SAHTE METRİKLER (Zaman Serisi)
INSERT INTO public.sensor_metrics (metric_id, value, metadata) VALUES 
('refinery_temp', 84.5, '{"unit": "C", "station": "Aliaga"}'),
('terminal_pressure', 12.2, '{"unit": "bar", "station": "Ceyhan"}'),
('storage_level', 92.0, '{"unit": "%", "station": "Yarimca"}'),
('efficiency_rate', 0.94, '{"unit": "ratio", "dept": "Production"}')
ON CONFLICT DO NOTHING;
