import React from 'react';
import { Student } from '../types';
import { QURAN_SURAHS, QuranSurah } from '../data/quranSurahs';
import { BookOpen, MessageSquare, ClipboardCheck, ArrowRight, Calendar, ChevronDown } from 'lucide-react';

interface StudentTopSectionProps {
  student: Student | null;
  visibleMonthLabel: string;
  onOpenSummary: () => void;
  onOpenNotes: () => void;
  onViewTodayHomework: () => void;
  onOpenMonthPicker: () => void;
}

export const StudentTopSection: React.FC<StudentTopSectionProps> = ({
  student,
  visibleMonthLabel,
  onOpenSummary,
  onOpenNotes,
  onViewTodayHomework,
  onOpenMonthPicker,
}) => {
  if (!student) return null;

  // Resolve current reading surah and ayah
  const currentSurahNumber = student.tilawaSurah || 33; // Default to Al-Ahzab (33)
  const currentSurah: QuranSurah =
    QURAN_SURAHS.find((s) => s.number === currentSurahNumber) ||
    QURAN_SURAHS[32] ||
    QURAN_SURAHS[0];
  const currentAyah = Math.min(student.tilawaAyah || 54, currentSurah.ayahCount);

  // Unread note count calculation (hidden when 0)
  const unreadCount = student.memorizationFocus
    ? student.memorizationFocus.split('\n').filter((l) => l.trim().length > 0).length
    : 0;

  const photoSrc = student.photoUrl || '/student_default.jpg';

  return (
    <div id="student-top-section" className="w-full flex flex-col space-y-2 pt-0.5 pb-1">
      {/* A. Header Card */}
      <div
        id="student-header-card"
        className="w-full bg-white rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#B8860B]/15 flex items-center justify-between gap-2.5 sm:gap-3"
      >
        {/* Left: Round Student Photo */}
        <div className="relative shrink-0">
          <img
            src={photoSrc}
            alt={student.name}
            onError={(e) => {
              // Fallback to default photo if specified photo fails
              const target = e.currentTarget;
              if (target.src !== '/student_default.jpg') {
                target.src = '/student_default.jpg';
              }
            }}
            className="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] rounded-full object-cover ring-2 ring-[#B8860B]/25 shadow-xs"
            style={{
              objectPosition: student.photoPosition || 'center 20%',
              transform: student.photoZoom ? `scale(${student.photoZoom})` : undefined,
            }}
          />
        </div>

        {/* Center: Current Reading Label & Surah / Ayah info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-[11px] sm:text-xs font-medium text-[#5B6478] font-sans leading-tight mb-1">
            Current reading
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            {/* Arabic Surah Name in large Arabic font */}
            <span
              dir="rtl"
              className="font-arabic font-bold text-xl sm:text-2xl text-[#0E5C56] leading-none shrink-0"
            >
              {currentSurah.arabicName}
            </span>

            {/* Subtle separator dot */}
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#9B7008] inline-block shrink-0"
              aria-hidden="true"
            />

            {/* Ayah number in dark gold (separate inline element with dir="ltr") */}
            <span
              dir="ltr"
              className="font-sans font-extrabold text-sm sm:text-base text-[#9B7008] leading-none whitespace-nowrap shrink-0"
            >
              Ayah {currentAyah}
            </span>
          </div>
        </div>

        {/* Right: Summary and Note icon buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Summary button */}
          <div className="flex flex-col items-center">
            <button
              id="top-summary-btn"
              type="button"
              onClick={onOpenSummary}
              className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#E0F2F1] text-[#0E5C56] hover:bg-[#CCECE8] active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-[#0E5C56]/10"
              title="Open Memorization Summary"
            >
              <BookOpen className="w-5 h-5 text-[#0E5C56] stroke-[2.2]" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 mt-1 select-none">
              Summary
            </span>
          </div>

          {/* Note button */}
          <div className="flex flex-col items-center">
            <button
              id="top-note-btn"
              type="button"
              onClick={onOpenNotes}
              className="relative w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#E1EAF8] text-[#2563EB] hover:bg-[#D4E2F6] active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-[#2563EB]/10"
              title="Open Teacher Note"
            >
              <MessageSquare className="w-5 h-5 text-[#2563EB] stroke-[2.2]" />

              {/* Red unread badge (hidden when 0) */}
              {unreadCount > 0 && (
                <span
                  id="top-note-badge"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white pointer-events-none"
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="text-[11px] font-semibold text-slate-700 mt-1 select-none">
              Note
            </span>
          </div>
        </div>
      </div>

      {/* B. Under the card: Row with two buttons (~44px height) */}
      <div className="w-full flex items-center gap-2 pt-0.5">
        {/* Primary button: "View today's homework" */}
        <button
          id="view-today-homework-btn"
          type="button"
          onClick={onViewTodayHomework}
          className="flex-1 h-[44px] min-h-[44px] px-3.5 sm:px-4 rounded-full bg-[#0E5C56] hover:bg-[#0B4A45] active:scale-98 text-white font-sans font-bold text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer border border-[#0E5C56]"
          title="View today's homework"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardCheck className="w-4 h-4 text-[#F5EFDD] shrink-0 stroke-[2.2]" />
            <span className="truncate">View today&apos;s homework</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#F5EFDD] shrink-0 stroke-[2.2]" />
        </button>

        {/* Secondary button: Calendar + Month Year + Down chevron */}
        <button
          id="month-picker-toggle-btn"
          type="button"
          onClick={onOpenMonthPicker}
          className="h-[44px] min-h-[44px] px-3 sm:px-3.5 rounded-full bg-white hover:bg-emerald-50/50 active:scale-98 border border-[#0E5C56]/40 text-[#0E5C56] font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          title="Select month"
        >
          <Calendar className="w-4 h-4 text-[#0E5C56] shrink-0 stroke-[2]" />
          <span>{visibleMonthLabel}</span>
          <ChevronDown className="w-4 h-4 text-[#0E5C56] shrink-0 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
