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
    parent_password_hash TEXT, -- SHA-256 hash for parent family-scoped login
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
    motivational_message TEXT,
    memorization_focus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.1 Create Dedicated Table for Weekly Stars & Motivational Messages
CREATE TABLE IF NOT EXISTS public.student_weekly_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    week_end_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    stars NUMERIC(3, 1) NOT NULL DEFAULT 5, -- 0 to 5
    disabled_auto BOOLEAN DEFAULT false,
    title TEXT, -- Written Title next to stars
    message TEXT, -- Written Motivational Words / Notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT student_weekly_stars_unique UNIQUE (student_id, week_end_date)
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
    on_time_score INTEGER, -- 100, 80, 60, 40 or null (On-time score)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration safety for already existing tables:
ALTER TABLE IF EXISTS public.homework_entries ADD COLUMN IF NOT EXISTS on_time_score INTEGER;
ALTER TABLE IF EXISTS public.entries ADD COLUMN IF NOT EXISTS on_time_score INTEGER;
ALTER TABLE IF EXISTS public.families ADD COLUMN IF NOT EXISTS parent_password_hash TEXT;

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_homework_entries_student_id ON public.homework_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_entries_date ON public.homework_entries(date);
CREATE INDEX IF NOT EXISTS idx_students_family_id ON public.students(family_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_weekly_stars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access on student_weekly_stars" ON public.student_weekly_stars;
CREATE POLICY "Allow public access on student_weekly_stars" ON public.student_weekly_stars FOR ALL USING (true) WITH CHECK (true);

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

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'student_surah_tracker'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_surah_tracker;
  END IF;
END $$;

-- 8. Surah Memorization Tracker Table (Per student and per surah)
CREATE TABLE IF NOT EXISTS public.student_surah_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
    surah_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('not_memorized', 'in_progress', 'strong', 'medium', 'weak', 'forgot')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE (student_id, surah_number)
);

CREATE INDEX IF NOT EXISTS idx_surah_tracker_student_id ON public.student_surah_tracker(student_id);
CREATE INDEX IF NOT EXISTS idx_surah_tracker_status ON public.student_surah_tracker(status);

ALTER TABLE public.student_surah_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on student_surah_tracker" ON public.student_surah_tracker;
CREATE POLICY "Allow public read on student_surah_tracker" 
ON public.student_surah_tracker FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert/update/delete on student_surah_tracker" ON public.student_surah_tracker;
CREATE POLICY "Allow public insert/update/delete on student_surah_tracker" 
ON public.student_surah_tracker FOR ALL USING (true) WITH CHECK (true);

-- 9. Initial Seed Data (Families & Students)
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
