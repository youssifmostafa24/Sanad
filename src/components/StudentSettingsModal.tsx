import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Link2,
  Share2,
  Check,
  Settings,
  User,
  ArrowRight,
} from 'lucide-react';
import { Student } from '../types';
import { getAttendanceDaysSummary } from './StudentAttendanceModal';

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  familyName?: string;
  familyId?: string;
  isTeacherMode: boolean;
  onUpdateStudentAttendanceDays: (studentId: string, days: number[]) => void;
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

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  onClose,
  student,
  familyName = 'الأسرة',
  familyId,
  isTeacherMode,
  onUpdateStudentAttendanceDays,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const studentAttendanceDays = student.attendanceDays || [1, 5];

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
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="student-settings-modal-overlay"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4"
          dir="rtl"
        >
          {/* Backdrop */}
          <motion.div
            id="student-settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card / Separate Page */}
          <motion.div
            id="student-settings-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#FAF6EE] text-[#1F2A3D] rounded-3xl shadow-2xl border border-[#B8860B]/30 overflow-hidden flex flex-col my-auto z-10 max-h-[92vh]"
          >
            {/* Header: Title + Student Badge + Close Button */}
            <div className="bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] px-5 py-3.5 flex items-center justify-between border-b border-[#B8860B]/40 shadow-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Student Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-sans font-bold text-base shadow-md shrink-0 border-2 border-[#B8860B]"
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {student.name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-sans font-bold text-base sm:text-lg text-[#F1E7CE] truncate">
                      إعدادات الطالب
                    </h2>
                    <span className="text-xs bg-[#B8860B]/30 text-[#F1E7CE] px-2 py-0.5 rounded-full font-bold">
                      {student.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#B8860B] font-sans truncate">
                    {familyName} • أيام الحضور ورابط المشاركة
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                id="close-student-settings-btn"
                type="button"
                onClick={onClose}
                aria-label="إغلاق الإعدادات"
                className="p-1.5 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content: The exact 2 sections requested */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
              {/* =========================================================================
                  القسم الأول: الإعدادات (أيام الحضور)
                 ========================================================================= */}
              <section id="settings-section-attendance" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Calendar className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      الإعدادات (أيام الحضور)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/15 px-2.5 py-0.5 rounded-full">
                    مخصص لهذا الطالب
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div>
                    <p className="text-[11.5px] sm:text-xs text-[#5B6478] font-medium leading-relaxed">
                      اختر أيام حضور الطالب لتحديد مواعيد التسميع والترحيل التلقائي:
                    </p>
                  </div>

                  {/* Interactive Week Days Grid: Sat to Fri */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5" id="settings-attendance-days-grid">
                    {WEEK_DAYS.map(({ dayIndex, shortLabel, label }) => {
                      const isSelected = studentAttendanceDays.includes(dayIndex);
                      return (
                        <button
                          key={`settings-day-${dayIndex}`}
                          id={`settings-day-toggle-${dayIndex}`}
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
                    <span className="text-[10.5px] font-bold text-[#5B6478]">نماذج سريعة:</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([1, 5])}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
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
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
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
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
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
                  <div className="pt-2.5 border-t border-[#B8860B]/15 flex items-center justify-between text-[11px] sm:text-xs text-[#0E5C56] bg-[#FAF6EE] px-3 py-2 rounded-xl">
                    <span className="font-semibold">الأيام المعتمدة:</span>
                    <span className="font-bold text-[#0E5C56]">
                      {getAttendanceDaysSummary(studentAttendanceDays)}
                    </span>
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  القسم الثاني: رابط المشاركة
                 ========================================================================= */}
              <section id="settings-section-share-link" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Link2 className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      رابط المشاركة
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/15 px-2.5 py-0.5 rounded-full">
                    مباشر للطالب
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <p className="text-[11.5px] sm:text-xs text-[#5B6478] font-medium leading-relaxed">
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
                      id="modal-copy-share-btn"
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
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
                    id="modal-native-share-btn"
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Share2 className="w-4 h-4 text-[#B8860B]" />
                    <span>مشاركة عبر التطبيقات (واتساب / تليجرام)</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Modal Footer: Done/Close Button */}
            <div className="p-3 sm:p-4 bg-[#F5EFDD] border-t border-[#B8860B]/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#5B6478] font-medium">
                يتم حفظ التغييرات تلقائياً
              </span>
              <button
                id="done-student-settings-btn"
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
