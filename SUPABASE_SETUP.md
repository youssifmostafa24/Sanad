# دليل ربط التطبيق بقاعدة بيانات Supabase 🚀

تمت برمجة التطبيق بالكامل ليدعم قاعدة بيانات **Supabase (PostgreSQL)** السحابية في الوقت الفعلي (Real-time).

---

## خطوات الربط السريع (في أقل من دقيقتين):

### 1. إنشاء مشروع جديد على Supabase
1. اذهب إلى [Supabase.com](https://supabase.com) وسجّل الدخول.
2. اضغط على **"New Project"**.
3. اختر اسم المشروع (مثلاً: `sanad-quran-tracker`)، وأدخل كلمة مرور لقاعدة البيانات، ثم اضغط **"Create new project"**.

---

### 2. تشغيل ملف الجداول والبيانات (SQL Script)
1. من القائمة الجانبية في Supabase، اضغط على **SQL Editor**.
2. اضغط على **New query**.
3. افتح الملف المرفق في هذا المشروع `supabase_schema.sql` (أو `supabase/schema.sql`).
4. انسخ كامل محتواه والصقه في محرر SQL على Supabase.
5. اضغط على زر **Run** (تشغيل) الأخضر في الأسفل.
   - سيتم إنشاء الجداول: `families`, `students`, `homework_entries`.
   - سيتم تفعيل سياسات الأمان (RLS) ومزامنة التحديثات اللحظية (Realtime).
   - سيتم إدخال البيانات التجريبية الأولية لجميع الطلاب تلقائياً.

---

### 3. نسخ مفاتيح الربط (API Keys)
1. من لوحة تحكم Supabase، ادخل على **Project Settings** (أيقونة الترس ⚙️ بالأسفل) ثم اضغط على **API**.
2. ستجد معلومتين أساسيتين:
   - **Project URL** (مثل: `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> انسخ المفتاح المسمى **`anon` `public`**.

---

### 4. إضافة المفاتيح في مشروعك
في ملف البيئة `.env` (أو في إعدادات **Environment Variables** على GitHub / Vercel / Lovable):

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

---

## كيف يعمل التطبيق بعد الربط؟
- **مزامنة فورية (Real-time):** بمجرد إضافة أو تعديل أي واجب أو تقييم من قبل المعلم، يتم حفظه فوراً في Supabase وتحديثه مباشرة على هواتف أولياء الأمور دون الحاجة لإعادة تحميل الصفحة.
- **تخزين احتياطي ذكي:** إذا لم تكن مفاتيح Supabase مضافة بعد، يواصل التطبيق العمل كالمعتاد مستخدماً الذاكرة المحلية (localStorage) دون أن يواجه أي عطل.
