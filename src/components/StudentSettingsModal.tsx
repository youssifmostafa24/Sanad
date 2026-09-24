import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Link2,
  Share2,
  Check,
  Camera,
  Upload,
  RotateCcw,
  Sliders,
  ZoomIn,
  Move,
  Trash2,
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
  onUpdateStudentPhoto?: (
    studentId: string,
    photoUrl: string,
    photoPosition?: string,
    photoZoom?: number
  ) => void;
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
  onUpdateStudentPhoto,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || '');
  
  // Parse initial position e.g. "50% 20%"
  const initialPos = (() => {
    if (student.photoPosition) {
      const parts = student.photoPosition.split(' ');
      if (parts.length === 2) {
        const x = parseInt(parts[0], 10);
        const y = parseInt(parts[1], 10);
        return {
          x: isNaN(x) ? 50 : x,
          y: isNaN(y) ? 20 : y,
        };
      }
    }
    return { x: 50, y: 20 };
  })();

  const [posX, setPosX] = useState(initialPos.x);
  const [posY, setPosY] = useState(initialPos.y);
  const [zoom, setZoom] = useState(student.photoZoom || 1.0);
  const [showPhotoControls, setShowPhotoControls] = useState(false);

  // Synchronize when student changes
  useEffect(() => {
    setPhotoUrl(student.photoUrl || '');
    if (student.photoPosition) {
      const parts = student.photoPosition.split(' ');
      if (parts.length === 2) {
        setPosX(parseInt(parts[0], 10) || 50);
        setPosY(parseInt(parts[1], 10) || 20);
      }
    } else {
      setPosX(50);
      setPosY(20);
    }
    setZoom(student.photoZoom || 1.0);
  }, [student]);

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
      if (studentAttendanceDays.length <= 1) return;
      updated = studentAttendanceDays.filter((d) => d !== dayIndex);
    } else {
      updated = [...studentAttendanceDays, dayIndex].sort((a, b) => a - b);
    }
    onUpdateStudentAttendanceDays(student.id, updated);
  };

  const handleSetPresetDays = (days: number[]) => {
    onUpdateStudentAttendanceDays(student.id, days);
  };

  // Direct Student Link
  const getShareUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (familyId) url.searchParams.set('fam', familyId);
    url.searchParams.set('student', student.id);
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

  // Photo handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setPhotoUrl(result);
        setShowPhotoControls(true);
        onUpdateStudentPhoto?.(student.id, result, `${posX}% ${posY}%`, zoom);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePositionAndZoom = (newX: number, newY: number, newZoom: number) => {
    setPosX(newX);
    setPosY(newY);
    setZoom(newZoom);
    if (photoUrl) {
      onUpdateStudentPhoto?.(student.id, photoUrl, `${newX}% ${newY}%`, newZoom);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPosX(50);
    setPosY(20);
    setZoom(1.0);
    setShowPhotoControls(false);
    onUpdateStudentPhoto?.(student.id, '', '50% 20%', 1.0);
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

          {/* Modal Card */}
          <motion.div
            id="student-settings-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#FAF6EE] text-[#1F2A3D] rounded-3xl shadow-2xl border border-[#B8860B]/30 overflow-hidden flex flex-col my-auto z-10 max-h-[92vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] px-5 py-3.5 flex items-center justify-between border-b border-[#B8860B]/40 shadow-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Student Avatar / Photo Thumbnail */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-sans font-bold text-base shadow-md shrink-0 border-2 border-[#B8860B]"
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${posX}% ${posY}%`,
                        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                      }}
                    />
                  ) : (
                    student.name.charAt(0)
                  )}
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
                    {familyName} • الصورة الشخصية وأيام الحضور
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

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
              {/* =========================================================================
                  القسم الأول: صورة الطالب وتوسيطها في الإطار
                 ========================================================================= */}
              <section id="settings-section-photo" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Camera className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      صورة الطالب الشخصية
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/15 px-2.5 py-0.5 rounded-full">
                    معاينة حية وتوسيط
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3.5">
                  {/* Portrait Live Preview & Upload Action */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Portrait Frame Preview */}
                    <div className="w-32 h-40 sm:w-36 sm:h-44 bg-white rounded-[22px] border-2 border-[#B8860B]/40 overflow-hidden shadow-sm flex flex-col shrink-0">
                      <div className="relative flex-1 bg-gradient-to-b from-[#FAF6EE] to-[#EAE0CA] overflow-hidden flex items-center justify-center">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={student.name}
                            className="w-full h-full object-cover transition-all"
                            style={{
                              objectPosition: `${posX}% ${posY}%`,
                              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center text-white"
                            style={{
                              background: `linear-gradient(135deg, ${student.color || '#0E5C56'}dd, ${student.color || '#0E5C56'})`,
                            }}
                          >
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold font-sans shadow-inner">
                              {student.name.charAt(0)}
                            </div>
                            <span className="text-[11px] text-white/90 font-serif mt-1">
                              {student.arabicName || student.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="py-1.5 px-1 text-center bg-white border-t border-amber-100/60">
                        <span className="font-bold text-xs text-[#B8860B] block truncate">
                          {student.name}
                        </span>
                      </div>
                    </div>

                    {/* Controls & Upload Button */}
                    <div className="flex-1 space-y-2.5 w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
                      >
                        <Upload className="w-4 h-4 text-[#B8860B]" />
                        <span>اختيار صورة من الجهاز / الجوال</span>
                      </button>

                      {photoUrl && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPhotoControls(!showPhotoControls)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#B8860B]" />
                            <span>{showPhotoControls ? 'إخفاء الضبط' : 'ضبط التوسيط والتكبير'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            title="إزالة الصورة والرجوع للشعار الافتراضي"
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-[#5B6478] leading-relaxed">
                        اختر صورة مناسبة للطالب، ثم اضبط موضع الوجه في الإطار ليظهر بدقة على الواجهة الرئيسية.
                      </p>
                    </div>
                  </div>

                  {/* Centering & Zoom Adjusters */}
                  {(showPhotoControls || photoUrl) && (
                    <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#B8860B]/20 space-y-3">
                      {/* Vertical Centering (Y-axis) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0E5C56] flex items-center gap-1">
                            <Move className="w-3.5 h-3.5 text-[#B8860B]" />
                            توسيط رأسي (أعلى / أسفل):
                          </span>
                          <span className="font-mono text-[#5B6478] font-semibold">{posY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={posY}
                          onChange={(e) =>
                            handleUpdatePositionAndZoom(posX, parseInt(e.target.value, 10), zoom)
                          }
                          className="w-full accent-[#0E5C56] cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-[#5B6478]">
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 10, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            أعلى (10%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 30, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            وسط أعلى (30%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 50, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            وسط (50%)
                          </button>
                        </div>
                      </div>

                      {/* Zoom Slider */}
                      <div className="space-y-1 pt-1 border-t border-[#B8860B]/15">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0E5C56] flex items-center gap-1">
                            <ZoomIn className="w-3.5 h-3.5 text-[#B8860B]" />
                            تكبير وتصغير الصورة:
                          </span>
                          <span className="font-mono text-[#5B6478] font-semibold">
                            {zoom.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.1"
                          value={zoom}
                          onChange={(e) =>
                            handleUpdatePositionAndZoom(posX, posY, parseFloat(e.target.value))
                          }
                          className="w-full accent-[#0E5C56] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* =========================================================================
                  القسم الثاني: الإعدادات (أيام الحضور)
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
                  القسم الثالث: رابط المشاركة المباشر للطالب
                 ========================================================================= */}
              <section id="settings-section-share-link" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Link2 className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      رابط صفحة الطالب المباشر
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/15 px-2.5 py-0.5 rounded-full">
                    مباشر لـ {student.name}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <p className="text-[11.5px] sm:text-xs text-[#5B6478] font-medium leading-relaxed">
                    عند فتح هذا الرابط، يفتح صفحة <strong>{student.name} ({student.arabicName || ''})</strong> مباشرة، مع إمكانية التنقل بين إخوته في نفس الأسرة:
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

            {/* Modal Footer */}
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
                تم
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
