-- ==============================================================================
-- SQL script to insert student Ali's data into Supabase
-- Student ID: student-ali
-- Total Homework Entries: 105
-- Total Weekly Star Ratings: 29
-- ==============================================================================

-- 1. Insert/Upsert Homework Entries
INSERT INTO public.homework_entries (
  id,
  student_id,
  date,
  hifz_text,
  hifz_grade,
  murajaa_text,
  murajaa_grade
) VALUES
  ('entry-ali-2026-01-06', 'student-ali', '2026-01-06', 'الطلاق ٨ -١٠', 80, 'المزمل ١٥ - end', 80),
  ('entry-ali-2026-01-08', 'student-ali', '2026-01-08', 'التغابن ١-٥', 80, 'الجن ١-٨', 40),
  ('entry-ali-2026-01-09', 'student-ali', '2026-01-09', 'التغابن 1-11', 40, 'نوح', 40),
  ('entry-ali-2026-01-13', 'student-ali', '2026-01-13', 'التغابن ١-٩', 80, 'نوح ١-٨', NULL),
  ('entry-ali-2026-01-15', 'student-ali', '2026-01-15', 'التغابن ١٣-٩', 80, 'نوح ١-٨', 80),
  ('entry-ali-2026-01-16', 'student-ali', '2026-01-16', 'التغابن ١٣-end', 80, 'نوح ٨-٢٤', NULL),
  ('entry-ali-2026-01-20', 'student-ali', '2026-01-20', 'المنافقون 1-6', 40, 'المطففين ١-١٦', 80),
  ('entry-ali-2026-01-22', 'student-ali', '2026-01-22', 'المنافقون 1-7', 60, 'المطففين ١-١٦', 100),
  ('entry-ali-2026-01-23', 'student-ali', '2026-01-23', 'المنافقون ٦ - end', 60, 'الانفطار', 80),
  ('entry-ali-2026-01-27', 'student-ali', '2026-01-27', 'المنافقون ٦ - end', 60, 'التكوير', 60),
  ('entry-ali-2026-01-29', 'student-ali', '2026-01-29', 'المنافقون كاملة', 60, 'عبس', 40),
  ('entry-ali-2026-01-30', 'student-ali', '2026-01-30', 'الجمعة 1-6', NULL, 'عبس', NULL),
  ('entry-ali-2026-02-03', 'student-ali', '2026-02-03', 'الجمعة 1-6', 100, 'عبس', 80),
  ('entry-ali-2026-02-05', 'student-ali', '2026-02-05', 'الجمعة 6-end', 80, 'التكوير', NULL),
  ('entry-ali-2026-02-06', 'student-ali', '2026-02-06', '', NULL, 'النازعات', 40),
  ('entry-ali-2026-02-17', 'student-ali', '2026-02-17', 'الصف ١-٩', 100, 'النبا', 60),
  ('entry-ali-2026-02-18', 'student-ali', '2026-02-18', 'الصف ٩-end', 80, 'النبا', 80),
  ('entry-ali-2026-02-19', 'student-ali', '2026-02-19', 'الممتحنه ١-٦', 40, 'المرسلات', 60),
  ('entry-ali-2026-02-20', 'student-ali', '2026-02-20', 'الممتحنه ١-٦', NULL, 'المرسلت ١-٣٠', NULL),
  ('entry-ali-2026-02-23', 'student-ali', '2026-02-23', 'الممتحنه ١-٦', 40, 'المرسلت ١-٣٠', 80),
  ('entry-ali-2026-02-24', 'student-ali', '2026-02-24', 'الممتحنه ١-٣', 100, 'المرسلات 30-end', 60),
  ('entry-ali-2026-02-25', 'student-ali', '2026-02-25', 'الممتحنة 3-7', 40, 'المرسلات 30-end', 60),
  ('entry-ali-2026-02-26', 'student-ali', '2026-02-26', 'الممتحنة 3-7', NULL, 'الانسان ١-١٨', NULL),
  ('entry-ali-2026-02-27', 'student-ali', '2026-02-27', 'الممتحنة 3-7', 40, 'الانسان ١-١٨', 60),
  ('entry-ali-2026-03-02', 'student-ali', '2026-03-02', 'الممتحنة 3-7', 40, 'الانسان ١-١٢', 80),
  ('entry-ali-2026-03-03', 'student-ali', '2026-03-03', 'الممتحنة 1-3.5', 100, '١٢-end', 40),
  ('entry-ali-2026-03-04', 'student-ali', '2026-03-04', '1-7', 80, '10-20', 100),
  ('entry-ali-2026-03-05', 'student-ali', '2026-03-05', 'الممتحنة1-9', 80, 'الانسان 1-end', NULL),
  ('entry-ali-2026-03-09', 'student-ali', '2026-03-09', '', NULL, 'الانسان 1-18', 80),
  ('entry-ali-2026-03-10', 'student-ali', '2026-03-10', 'الممتحنة1-.9.5', 80, 'الانسان 18-end', NULL),
  ('entry-ali-2026-03-11', 'student-ali', '2026-03-11', '', NULL, 'القيامة', NULL),
  ('entry-ali-2026-03-25', 'student-ali', '2026-03-25', 'الممتحنة1-.9.5', 80, 'الانسان 18-end', 60),
  ('entry-ali-2026-03-26', 'student-ali', '2026-03-26', '1-10', 100, 'الانسان 18-end', 60),
  ('entry-ali-2026-03-27', 'student-ali', '2026-03-27', '5-11', 100, '25-end', NULL),
  ('entry-ali-2026-03-30', 'student-ali', '2026-03-30', 'الدخان 1-13', 80, '25-end', NULL),
  ('entry-ali-2026-03-31', 'student-ali', '2026-03-31', '1-18', 80, '', NULL),
  ('entry-ali-2026-04-02', 'student-ali', '2026-04-02', '1-39', 60, '', NULL),
  ('entry-ali-2026-04-03', 'student-ali', '2026-04-03', '1-39', NULL, '', NULL),
  ('entry-ali-2026-04-09', 'student-ali', '2026-04-09', 'الممتحنة 1-11', 80, '25-end', 60),
  ('entry-ali-2026-04-10', 'student-ali', '2026-04-10', 'الممتحنة 11-end', 80, 'القيامة', NULL),
  ('entry-ali-2026-04-14', 'student-ali', '2026-04-14', '1-7 التحريم', 40, 'القيامة 1-14', 80),
  ('entry-ali-2026-04-16', 'student-ali', '2026-04-16', '1-7 التحريم', NULL, '14- 25', NULL),
  ('entry-ali-2026-04-17', 'student-ali', '2026-04-17', '1-7 التحريم', NULL, '14- 25', NULL),
  ('entry-ali-2026-04-21', 'student-ali', '2026-04-21', '1-7 التحريم', NULL, '14- 25', NULL),
  ('entry-ali-2026-04-23', 'student-ali', '2026-04-23', '4-9', 80, '25-end', 80),
  ('entry-ali-2026-04-24', 'student-ali', '2026-04-24', '7-12', 80, 'القيامة', 80),
  ('entry-ali-2026-04-28', 'student-ali', '2026-04-28', '٫الطلاق 1-5', 100, 'المدثر', 80),
  ('entry-ali-2026-04-30', 'student-ali', '2026-04-30', '5-12', 80, 'المزمل', 40),
  ('entry-ali-2026-05-01', 'student-ali', '2026-05-01', 'التغابن ١-٩', 100, 'المزمل', 60),
  ('entry-ali-2026-05-05', 'student-ali', '2026-05-05', 'التغابن 9-end', NULL, '14-end', 60),
  ('entry-ali-2026-05-07', 'student-ali', '2026-05-07', 'المنافقون', 60, 'الجن ١-١٣', 80),
  ('entry-ali-2026-05-08', 'student-ali', '2026-05-08', 'الجمعة', 80, '١٣-٢٠', 80),
  ('entry-ali-2026-05-12', 'student-ali', '2026-05-12', 'الجمعة', 100, '١٣-٢٠', 100),
  ('entry-ali-2026-05-13', 'student-ali', '2026-05-13', 'الصف', 100, '٢٠-٢٥', 80),
  ('entry-ali-2026-05-15', 'student-ali', '2026-05-15', 'الممتحنه ١-٩', 100, '٢٥- end', 80),
  ('entry-ali-2026-05-19', 'student-ali', '2026-05-19', '9_end', 80, 'نوح', 40),
  ('entry-ali-2026-05-21', 'student-ali', '2026-05-21', 'الحشر 1-6', NULL, '1-10', NULL),
  ('entry-ali-2026-05-22', 'student-ali', '2026-05-22', '1-10', 100, '1-19', 60),
  ('entry-ali-2026-05-26', 'student-ali', '2026-05-26', '10-14', NULL, '1-19', NULL),
  ('entry-ali-2026-06-02', 'student-ali', '2026-06-02', '10-14', 40, '1-19', 80),
  ('entry-ali-2026-06-03', 'student-ali', '2026-06-03', '10-14', 80, '15-end', 60),
  ('entry-ali-2026-06-04', 'student-ali', '2026-06-04', '18-end', 100, 'المعرج 1-28', 60),
  ('entry-ali-2026-06-05', 'student-ali', '2026-06-05', 'المجادلة 1-6', 80, '18-28', 80),
  ('entry-ali-2026-06-08', 'student-ali', '2026-06-08', '6-10', 80, '28-35', 80),
  ('entry-ali-2026-06-09', 'student-ali', '2026-06-09', '10-15', NULL, '35-40', NULL),
  ('entry-ali-2026-06-10', 'student-ali', '2026-06-10', '10-15', 100, '35-40', 80),
  ('entry-ali-2026-06-11', 'student-ali', '2026-06-11', 'المجادلة كاملة', NULL, '-----', NULL),
  ('entry-ali-2026-06-15', 'student-ali', '2026-06-15', 'المجادلة كاملة', 80, '', NULL),
  ('entry-ali-2026-06-16', 'student-ali', '2026-06-16', 'الحديد 1-8', 80, 'المعارج', 80),
  ('entry-ali-2026-06-17', 'student-ali', '2026-06-17', 'الحديد ٨-١٥', 60, 'الحاقه ١-١٥', NULL),
  ('entry-ali-2026-06-18', 'student-ali', '2026-06-18', '1-24', 60, 'الحاقه ١-١٥', 80),
  ('entry-ali-2026-06-22', 'student-ali', '2026-06-22', '18-end', 60, 'الحاقة 1-20', 60),
  ('entry-ali-2026-06-23', 'student-ali', '2026-06-23', '25-end', 80, '20-end', 40),
  ('entry-ali-2026-06-24', 'student-ali', '2026-06-24', 'الحديد كاملة', 80, '~~~~~~', NULL),
  ('entry-ali-2026-06-25', 'student-ali', '2026-06-25', 'الواقعة ١_١٦', NULL, '20-end', NULL),
  ('entry-ali-2026-07-08', 'student-ali', '2026-07-08', 'الواقعة ١_١٦', 80, '20-end', 40),
  ('entry-ali-2026-07-09', 'student-ali', '2026-07-09', '١٦-٤٠', 40, '٢٠-٣٥', 60),
  ('entry-ali-2026-07-13', 'student-ali', '2026-07-13', '١٦-٣٣', 60, '٨-٣٥', 40),
  ('entry-ali-2026-07-14', 'student-ali', '2026-07-14', '1-45', NULL, 'الحاقة 1-20', NULL),
  ('entry-ali-2026-07-29', 'student-ali', '2026-07-29', '1-45', 80, 'الحاقة 1-20', 40),
  ('entry-ali-2026-07-30', 'student-ali', '2026-07-30', '35-50', NULL, '', NULL),
  ('entry-ali-2026-08-03', 'student-ali', '2026-08-03', '١-٥٠', 80, 'الحاقة 1-24', 40),
  ('entry-ali-2026-08-04', 'student-ali', '2026-08-04', '50-60', 40, 'القلم ١-١٦', 40),
  ('entry-ali-2026-08-05', 'student-ali', '2026-08-05', '50-60', 80, 'القلم١-١٠', 80),
  ('entry-ali-2026-08-06', 'student-ali', '2026-08-06', '50-80', 60, 'القلم١-٢٠', 60),
  ('entry-ali-2026-08-10', 'student-ali', '2026-08-10', '50-70', NULL, 'القلم١-٢٠', NULL),
  ('entry-ali-2026-08-11', 'student-ali', '2026-08-11', '50-76', 80, 'القلم ١٠-١٦', NULL),
  ('entry-ali-2026-08-12', 'student-ali', '2026-08-12', '٧٦-٨٦', 80, '', NULL),
  ('entry-ali-2026-08-13', 'student-ali', '2026-08-13', '76-end', 20, '', NULL),
  ('entry-ali-2026-08-17', 'student-ali', '2026-08-17', '٧٦-٨٦', 80, 'الملك ١-١٩', 80),
  ('entry-ali-2026-08-18', 'student-ali', '2026-08-18', '٧٧- النهاية   الواقعة', NULL, '12-22', 40),
  ('entry-ali-2026-08-19', 'student-ali', '2026-08-19', '٧٧- النهاية   الواقعة', 80, '12-22', 80),
  ('entry-ali-2026-08-20', 'student-ali', '2026-08-20', 'الواقعة', 40, '', NULL),
  ('entry-ali-2026-08-24', 'student-ali', '2026-08-24', 'الواقعة 1-50', 60, 'الملك ١-٢٢', 80),
  ('entry-ali-2026-08-25', 'student-ali', '2026-08-25', 'الواقعة 1-50', NULL, '٢٢-end', NULL),
  ('entry-ali-2026-08-27', 'student-ali', '2026-08-27', '50 -76', 80, '٢٢-end', 80),
  ('entry-ali-2026-08-28', 'student-ali', '2026-08-28', '٧٧- النهاية', 80, 'الملك كامله', 80),
  ('entry-ali-2026-09-02', 'student-ali', '2026-09-02', 'الواقعه كامله', 60, '', NULL),
  ('entry-ali-2026-09-03', 'student-ali', '2026-09-03', 'الرحمن ١-١٨', 100, 'الملك كامله', 60),
  ('entry-ali-2026-09-04', 'student-ali', '2026-09-04', 'الرحمن ١-٣٥', 80, 'الملك ١٢ - النهاية', NULL),
  ('entry-ali-2026-09-08', 'student-ali', '2026-09-08', 'الرحمن ٢٠-٥١', 40, 'الناس - الزلزله', 40),
  ('entry-ali-2026-09-10', 'student-ali', '2026-09-10', 'الرحمن ١-٣٥', 80, 'الناس - الزلزله', 60),
  ('entry-ali-2026-09-11', 'student-ali', '2026-09-11', '٣٣-٥٥', 80, 'الهمزة - العاديات', 80),
  ('entry-ali-2026-09-14', 'student-ali', '2026-09-14', '٤٢-end', 60, 'الزلزلة البينة القدر القارعة', 80),
  ('entry-ali-2026-09-15', 'student-ali', '2026-09-15', '٤٢-end', NULL, 'العلق التين الشرح الضحي', NULL)
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  hifz_text = EXCLUDED.hifz_text,
  hifz_grade = EXCLUDED.hifz_grade,
  murajaa_text = EXCLUDED.murajaa_text,
  murajaa_grade = EXCLUDED.murajaa_grade;

-- 2. Update Student's Weekly Stars in students table
UPDATE public.students
SET manual_weekly_stars = '[
  {
    "weekEndDate": "2026-01-15",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-01-22",
    "stars": 5,
    "score": 100
  },
  {
    "weekEndDate": "2026-01-29",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-02-05",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-02-12",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-02-19",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-02-26",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-03-05",
    "stars": 2,
    "score": 40
  },
  {
    "weekEndDate": "2026-03-12",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-04-02",
    "stars": 3,
    "score": 70
  },
  {
    "weekEndDate": "2026-04-09",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-04-16",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-04-23",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-04-30",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-05-07",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-05-14",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-05-21",
    "stars": 5,
    "score": 100
  },
  {
    "weekEndDate": "2026-05-28",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-06-11",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-06-18",
    "stars": 5,
    "score": 100
  },
  {
    "weekEndDate": "2026-06-25",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-07-09",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-07-30",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-08-06",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-08-13",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-08-20",
    "stars": 3,
    "score": 60
  },
  {
    "weekEndDate": "2026-08-27",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-09-03",
    "stars": 4,
    "score": 80
  },
  {
    "weekEndDate": "2026-09-10",
    "stars": 3,
    "score": 60
  }
]'::jsonb
WHERE id = 'student-ali';
