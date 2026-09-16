import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Settings,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import { QURAN_SURAHS, QuranSurah } from '../data/quranSurahs';

interface StudentSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  familyName?: string;
  familyId?: string;
  isTeacherMode: boolean;
  onUpdateStudentTilawa: (studentId: string, surahNumber: number, ayahNumber: number) => void;
  onUpdateStudentAttendanceDays?: (studentId: string, days: number[]) => void;
  onOpenSurahProgress?: (student: Student) => void;
  onOpenPortal?: () => void;
  onOpenStudentSettings?: (student: Student) => void;
}

export const StudentSidebarDrawer: React.FC<StudentSidebarDrawerProps> = ({
  isOpen,
  onClose,
  student,
  familyName = 'الأسرة',
  familyId,
  isTeacherMode,
  onUpdateStudentTilawa,
  onOpenSurahProgress,
  onOpenPortal,
  onOpenStudentSettings,
}) => {
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

  const handleSurahChange = (surahNum: number) => {
    const targetSurah = QURAN_SURAHS.find((s) => s.number === surahNum);
    const maxAyahs = targetSurah ? targetSurah.ayahCount : 7;
    const clampedAyah = Math.min(currentAyah, maxAyahs);
    onUpdateStudentTilawa(student.id, surahNum, clampedAyah);
  };

  const handleAyahChange = (ayahNum: number) => {
    onUpdateStudentTilawa(student.id, currentSurahNumber, ayahNum);
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
                      سورة التلاوة الحالية
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#8A6305] bg-[#B8860B]/15 px-2 py-0.5 rounded-full">
                    موضع التلاوة
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-2.5">
                  {isTeacherMode ? (
                    <>
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

                      {/* Summary visual badge in Teacher mode */}
                      <div className="pt-2 border-t border-[#B8860B]/15 flex items-center justify-between text-[11px] text-[#0E5C56] bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl">
                        <span className="font-semibold">الورد الحالي المسجل:</span>
                        <span className="font-bold text-[#0E5C56]">
                          سورة {currentSurah.arabicName} (آية {currentAyah})
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Summary visual badge in Student mode */
                    <div className="flex items-center justify-between text-xs sm:text-sm text-[#0E5C56] bg-[#FAF6EE] px-3.5 py-2.5 rounded-xl border border-[#B8860B]/20">
                      <span className="font-semibold text-[#5B6478]">الورد الحالي المسجل:</span>
                      <span className="font-bold text-[#0E5C56]">
                        سورة {currentSurah.arabicName} (آية {currentAyah})
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* =========================================================================
                  زر إعدادات الطالب (أيام الحضور ورابط المشاركة)
                  يفتح صفحة منفصلة فيها إعدادات الطالب
                 ========================================================================= */}
              <section id="section-student-settings-nav" className="pt-1">
                <button
                  type="button"
                  id="drawer-student-settings-btn"
                  onClick={() => {
                    onClose();
                    onOpenStudentSettings?.(student);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] border border-[#B8860B]/35 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F1E7CE]/15 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] group-hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5 text-[#F1E7CE]" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#F1E7CE]">
                          إعدادات الطالب
                        </span>
                      </div>
                      <span className="block text-[11px] text-[#F1E7CE]/75 mt-0.5">
                        أيام الحضور ورابط المشاركة
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#B8860B]">
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              </section>

              {/* Complementary Utilities: Surah Memorization Matrix */}
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
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
