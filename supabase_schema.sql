-- ==============================================================================
-- Sanad Qur'an Tracker - Complete Supabase Database Schema & Initial Data
-- Instructions:
-- 1. Go to your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Click on "SQL Editor" in the left navigation menu.
-- 3. Click "New query", paste this entire script, and click "Run".
-- ==============================================================================

-- 1. Create Families Table
CREATE TABLE IF NOT EXISTS public.families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    attendance_days JSONB DEFAULT '[1, 5]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    family_id TEXT,
    name TEXT NOT NULL,
    arabic_name TEXT,
    color TEXT NOT NULL DEFAULT '#0E5C56',
    attendance_days JSONB DEFAULT '[1, 5]'::jsonb,
    tilawa_surah INTEGER DEFAULT 18,
    tilawa_ayah INTEGER DEFAULT 1,
    surah_ratings JSONB DEFAULT '{}'::jsonb,
    manual_weekly_stars JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Homework Entries Table
CREATE TABLE IF NOT EXISTS public.homework_entries (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    hifz_text TEXT DEFAULT '',
    hifz_grade INTEGER, -- 100, 80, 60, 40, 20 or null
    murajaa_text TEXT DEFAULT '',
    murajaa_grade INTEGER, -- 100, 80, 60, 40, 20 or null
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_homework_entries_student_id ON public.homework_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_entries_date ON public.homework_entries(date);
CREATE INDEX IF NOT EXISTS idx_students_family_id ON public.students(family_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_entries ENABLE ROW LEVEL SECURITY;

-- 6. Create Open Permissive Policies for the Web Client (anon key access)
DROP POLICY IF EXISTS "Allow public read access on families" ON public.families;
CREATE POLICY "Allow public read access on families" ON public.families FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert/update on families" ON public.families;
CREATE POLICY "Allow public insert/update on families" ON public.families FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on students" ON public.students;
CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert/update on students" ON public.students;
CREATE POLICY "Allow public insert/update on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on homework_entries" ON public.homework_entries;
CREATE POLICY "Allow public read access on homework_entries" ON public.homework_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert/update/delete on homework_entries" ON public.homework_entries;
CREATE POLICY "Allow public insert/update/delete on homework_entries" ON public.homework_entries FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Realtime Publications so changes sync instantly across all devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'families'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.families;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'students'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'homework_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.homework_entries;
  END IF;
END $$;

-- 8. Initial Seed Data (Families & Students)
INSERT INTO public.families (id, name, student_ids, attendance_days) VALUES
('family-1', 'Sulaymn + Ibrahim + Ali', '["student-sulayman", "student-ibrahim", "student-ali"]'::jsonb, '[1, 5]'::jsonb),
('family-2', 'Musab + umair + Uthman', '["student-musab", "student-umair", "student-uthman"]'::jsonb, '[1, 5]'::jsonb),
('family-3', 'Yusuf + Hayaa', '["student-yusuf", "student-hayaa"]'::jsonb, '[1, 5]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  student_ids = EXCLUDED.student_ids,
  attendance_days = EXCLUDED.attendance_days;

INSERT INTO public.students (id, family_id, name, arabic_name, color, attendance_days, tilawa_surah, tilawa_ayah) VALUES
('student-sulayman', 'family-1', 'Sulayman', 'سليمان', '#0E5C56', '[1, 5]'::jsonb, 18, 1),
('student-ibrahim', 'family-1', 'Ibrahim', 'إبراهيم', '#B8860B', '[1, 5]'::jsonb, 18, 45),
('student-ali', 'family-1', 'Ali', 'علي', '#2C5E8A', '[1, 5]'::jsonb, 18, 1),
('student-musab', 'family-2', 'Musab', 'مصعب', '#8B5CF6', '[1, 5]'::jsonb, 18, 1),
('student-umair', 'family-2', 'Umair', 'عمير', '#059669', '[1, 5]'::jsonb, 18, 1),
('student-uthman', 'family-2', 'Uthman', 'عثمان', '#D97706', '[1, 5]'::jsonb, 18, 1),
('student-yusuf', 'family-3', 'Yusuf', 'يوسف', '#DC2626', '[1, 5]'::jsonb, 18, 1),
('student-hayaa', 'family-3', 'Hayaa', 'هياء', '#7C3AED', '[1, 5]'::jsonb, 18, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  arabic_name = EXCLUDED.arabic_name,
  color = EXCLUDED.color,
  attendance_days = EXCLUDED.attendance_days;
