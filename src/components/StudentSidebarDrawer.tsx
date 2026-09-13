import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  BookOpen,
  Calendar,
  Link2,
  Share2,
  Home,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import { QURAN_SURAHS, QuranSurah } from '../data/quranSurahs';
import { getAttendanceDaysSummary } from './StudentAttendanceModal';

interface StudentSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  familyName?: string;
  familyId?: string;
  isTeacherMode: boolean;
  onUpdateStudentTilawa: (studentId: string, surahNumber: number, ayahNumber: number) => void;
  onUpdateStudentAttendanceDays: (studentId: string, days: number[]) => void;
  onOpenSurahProgress?: (student: Student) => void;
  onOpenPortal?: () => void;
}

const WEEK_DAYS: { dayIndex: number; label: string; shortLabel: string }[] = [
  { dayIndex: 6, label: 'السبت', shortLabel: 'سبت' },
  { dayIndex: 0, label: 'الأحد', shortLabel: 'أحد' },
  { dayIndex: 1, label: 'الإثنين', shortLabel: 'إثنين' },
  { dayIndex: 2, label: 'الثلاثاء', shortLabel: 'ثلاثاء' },
  { dayIndex: 3, label: 'الأربعاء', shortLabel: 'أربعاء' },
  { dayIndex: 4, label: 'الخميس', shortLabel: 'خميس' },
  { dayIndex: 5, label: 'الجمعة', shortLabel: 'جمعة' },
];

export const StudentSidebarDrawer: React.FC<StudentSidebarDrawerProps> = ({
  isOpen,
  onClose,
  student,
  familyName = 'الأسرة',
  familyId,
  isTeacherMode,
  onUpdateStudentTilawa,
  onUpdateStudentAttendanceDays,
  onOpenSurahProgress,
  onOpenPortal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!student) return null;

  const currentSurahNumber = student.tilawaSurah || 18; // default to Al-Kahf if unset
  const currentSurah: QuranSurah =
    QURAN_SURAHS.find((s) => s.number === currentSurahNumber) || QURAN_SURAHS[0];
  const currentAyah = Math.min(student.tilawaAyah || 1, currentSurah.ayahCount);

  const studentAttendanceDays = student.attendanceDays || [1, 5];

  const handleSurahChange = (surahNum: number) => {
    const targetSurah = QURAN_SURAHS.find((s) => s.number === surahNum);
    const maxAyahs = targetSurah ? targetSurah.ayahCount : 7;
    const clampedAyah = Math.min(currentAyah, maxAyahs);
    onUpdateStudentTilawa(student.id, surahNum, clampedAyah);
  };

  const handleAyahChange = (ayahNum: number) => {
    onUpdateStudentTilawa(student.id, currentSurahNumber, ayahNum);
  };

  const handleToggleDay = (dayIndex: number) => {
    let updated: number[];
    if (studentAttendanceDays.includes(dayIndex)) {
      if (studentAttendanceDays.length <= 1) return; // Keep at least one day
      updated = studentAttendanceDays.filter((d) => d !== dayIndex);
    } else {
      updated = [...studentAttendanceDays, dayIndex].sort((a, b) => a - b);
    }
    onUpdateStudentAttendanceDays(student.id, updated);
  };

  const handleSetPresetDays = (days: number[]) => {
    onUpdateStudentAttendanceDays(student.id, days);
  };

  const getShareUrl = () => {
    if (!familyId) return window.location.href;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('fam', familyId);
    url.searchParams.set('st', student.id);
    return url.toString();
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `جدول واجبات الطالب ${student.arabicName || student.name}`,
          text: `متابعة جدول حفظ وتلاوة ${student.arabicName || student.name} في حلقة القرآن الكريم`,
          url: url,
        });
      } catch {
        // Fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="student-sidebar-portal" className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* Backdrop blur overlay */}
          <motion.div
            id="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-out Drawer Panel (From Left Side) - Dedicated to Current Student */}
          <motion.div
            id="sidebar-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 bottom-0 left-0 w-88 max-w-[90vw] bg-[#FAF6EE] text-[#1F2A3D] shadow-2xl z-50 flex flex-col border-r border-[#B8860B]/25 overflow-y-auto"
          >
            {/* Drawer Header: Current Student Profile with Color Badge */}
            <div className="bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] px-5 py-4 flex items-center justify-between border-b border-[#B8860B]/40 shadow-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Student Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-sans font-bold text-lg shadow-md shrink-0 border-2 border-[#B8860B]"
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {student.name.charAt(0)}
                </div>

                {/* Names */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-sans font-bold text-base text-[#F1E7CE] truncate">
                      {student.name}
                    </h2>
                    {student.arabicName && (
                      <span className="text-xs text-[#F1E7CE]/90 font-medium">
                        ({student.arabicName})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#B8860B] font-sans truncate">
                    {familyName} • بيانات وإعدادات الطالب
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="close-sidebar-btn"
                type="button"
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="p-1.5 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: The 3 Requested Items in Strict Order */}
            <div className="p-4 space-y-5 flex-1" id="student-sidebar-content">
              {/* =========================================================================
                  أولاً: سورة التلاوة الحالية
                  عبارة عن قائمة منسدلة بسور القرآن وبجانبها قائمة منسدلة أخرى بعدد آيات السورة المحددة
                 ========================================================================= */}
              <section id="section-current-tilawa" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <BookOpen className="w-4 h-4 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      أولاً: سورة التلاوة الحالية
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#8A6305] bg-[#B8860B]/15 px-2 py-0.5 rounded-full">
                    موضع التلاوة
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-2.5">
                  <p className="text-[11px] text-[#5B6478] font-medium leading-relaxed">
                    حدد السورة ورقم الآية الحالية التي وصل إليها الطالب في ورد التلاوة:
                  </p>

                  {/* Two Dropdowns Side-by-Side: Surahs + Ayahs of the selected Surah */}
                  <div className="flex items-center gap-2 w-full">
                    {/* Dropdown 1: سور القرآن الكريم */}
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="tilawa-surah-select"
                        className="block text-[10px] font-bold text-[#5B6478] mb-1"
                      >
                        السورة:
                      </label>
                      <select
                        id="tilawa-surah-select"
                        value={currentSurahNumber}
                        onChange={(e) => handleSurahChange(Number(e.target.value))}
                        className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2 px-2 text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs truncate"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={`tilawa-s-${s.number}`} value={s.number}>
                            {s.number}. سورة {s.arabicName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown 2: بعدد آيات السورة المحددة */}
                    <div className="w-24 sm:w-28 shrink-0">
                      <label
                        htmlFor="tilawa-ayah-select"
                        className="block text-[10px] font-bold text-[#5B6478] mb-1"
                      >
                        الآية (من {currentSurah.ayahCount}):
                      </label>
                      <select
                        id="tilawa-ayah-select"
                        value={currentAyah}
                        onChange={(e) => handleAyahChange(Number(e.target.value))}
                        className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2 px-1 text-center text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs"
                      >
                        {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => (
                          <option key={`tilawa-a-${n}`} value={n}>
                            الآية {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Summary visual badge */}
                  <div className="pt-2 border-t border-[#B8860B]/15 flex items-center justify-between text-[11px] text-[#0E5C56] bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl">
                    <span className="font-semibold">الورد الحالي المسجل:</span>
                    <span className="font-bold text-[#0E5C56]">
                      سورة {currentSurah.arabicName} (آية {currentAyah})
                    </span>
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  ثانياً: الإعدادات
                  الخاصة بالطالب والتي فيها أيام حضوره
                 ========================================================================= */}
              <section id="section-student-settings" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Calendar className="w-4 h-4 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      ثانياً: الإعدادات (أيام الحضور)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/15 px-2 py-0.5 rounded-full">
                    مخصص لهذا الطالب
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-3">
                  <div>
                    <p className="text-[11px] text-[#5B6478] font-medium leading-relaxed">
                      اختر أيام حضور الطالب لتحديد مواعيد التسميع والترحيل التلقائي:
                    </p>
                  </div>

                  {/* Interactive Week Days Grid: Sat to Fri */}
                  <div className="grid grid-cols-7 gap-1" id="drawer-attendance-days-grid">
                    {WEEK_DAYS.map(({ dayIndex, shortLabel, label }) => {
                      const isSelected = studentAttendanceDays.includes(dayIndex);
                      return (
                        <button
                          key={`drawer-day-${dayIndex}`}
                          id={`drawer-day-toggle-${dayIndex}`}
                          type="button"
                          onClick={() => handleToggleDay(dayIndex)}
                          title={`${label}: ${isSelected ? 'محدد' : 'غير محدد'}`}
                          className={`py-2 px-0.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                            isSelected
                              ? 'bg-[#0E5C56] text-[#F1E7CE] border-[#0E5C56] shadow-xs'
                              : 'bg-[#FAF6EE] text-[#5B6478] hover:bg-[#F3EAD3] border-[#B8860B]/25'
                          }`}
                        >
                          <span className="text-[10px] sm:text-[11px]">{shortLabel}</span>
                          {isSelected ? (
                            <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-[#5B6478]">نماذج سريعة:</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([1, 5])}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 2 &&
                        studentAttendanceDays.includes(1) &&
                        studentAttendanceDays.includes(5)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      إثنين + جمعة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([0, 2, 4])}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 3 &&
                        studentAttendanceDays.includes(0) &&
                        studentAttendanceDays.includes(2) &&
                        studentAttendanceDays.includes(4)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      أحد + ثلاثاء + خميس
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([6, 1, 3])}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 3 &&
                        studentAttendanceDays.includes(6) &&
                        studentAttendanceDays.includes(1) &&
                        studentAttendanceDays.includes(3)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      سبت + إثنين + أربعاء
                    </button>
                  </div>

                  {/* Summary of Active Days */}
                  <div className="pt-2 border-t border-[#B8860B]/15 flex items-center justify-between text-[11px] text-[#0E5C56] bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl">
                    <span className="font-semibold">الأيام المعتمدة:</span>
                    <span className="font-bold text-[#0E5C56]">
                      {getAttendanceDaysSummary(studentAttendanceDays)}
                    </span>
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  ثالثاً: رابط المشاركة
                 ========================================================================= */}
              <section id="section-share-link" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Link2 className="w-4 h-4 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      ثالثاً: رابط المشاركة
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/15 px-2 py-0.5 rounded-full">
                    مباشر للطالب
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-3">
                  <p className="text-[11px] text-[#5B6478] font-medium leading-relaxed">
                    شارك هذا الرابط مع الطالب أو ولي الأمر لمتابعة جدول الواجبات والتقييمات مباشرة:
                  </p>

                  {/* URL Display and Copy Button */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl()}
                      className="flex-1 bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl px-2.5 py-2 text-[11px] text-[#5B6478] font-mono select-all focus:outline-none focus:ring-1 focus:ring-[#0E5C56]/30 truncate"
                    />

                    <button
                      id="drawer-copy-share-btn"
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                        copiedLink
                          ? 'bg-[#16A34A] text-white border border-[#16A34A]'
                          : 'bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] border border-[#0E5C56]'
                      }`}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5 text-[#B8860B]" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Native Mobile Share Button */}
                  <button
                    id="drawer-native-share-btn"
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full py-2 px-3 rounded-xl bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>مشاركة عبر التطبيقات (واتساب / تليجرام)</span>
                  </button>
                </div>
              </section>

              {/* Complementary Utilities: Surah Memorization Matrix & Main Portal */}
              <div className="pt-2 border-t border-[#B8860B]/20 space-y-2">
                {onOpenSurahProgress && (
                  <button
                    type="button"
                    id="drawer-student-surah-progress-btn"
                    onClick={() => {
                      onClose();
                      onOpenSurahProgress(student);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#FBF6E8] border border-[#B8860B]/25 text-[#0E5C56] text-xs font-bold transition-colors cursor-pointer flex items-center justify-between shadow-2xs group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B8860B] group-hover:scale-110 transition-transform" />
                      <span>سجل حفظ القرآن الكريم (114 سورة)</span>
                    </div>
                    <span className="text-[10px] text-[#8A6305] bg-[#B8860B]/15 px-2 py-0.5 rounded-full font-sans">
                      عرض
                    </span>
                  </button>
                )}

                {onOpenPortal && (
                  <button
                    type="button"
                    id="drawer-back-to-portal-btn"
                    onClick={() => {
                      onClose();
                      onOpenPortal();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EAD3] border border-[#B8860B]/20 text-[#5B6478] hover:text-[#0E5C56] text-xs font-medium transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-3.5 h-3.5 text-[#5B6478]" />
                      <span>الانتقال للبوابة الرئيسية (الأسر)</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
