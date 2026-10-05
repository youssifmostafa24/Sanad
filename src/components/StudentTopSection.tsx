import React, { useState } from 'react';
import { Student, StudentTopNavTab } from '../types';
import { QURAN_SURAHS, QuranSurah } from '../data/quranSurahs';
import { BookOpen, Bookmark, ArrowLeft, ChevronsUpDown, Home } from 'lucide-react';

export type { StudentTopNavTab };

/* =========================================================================
    1. 4-PILL TOP NAVIGATION BAR (Fixed directly under header)
   ========================================================================= */
interface StudentTopNavPillsProps {
  activeTab: StudentTopNavTab;
  onSelectTab: (tab: StudentTopNavTab) => void;
  onOpenSummary?: () => void;
  onOpenNotes?: () => void;
  unreadCount?: number;
}

export const StudentTopNavPills: React.FC<StudentTopNavPillsProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  return (
    <div
      id="fixed-top-pills-bar"
      className="shrink-0 w-full z-30 bg-[#F5EFDD] border-b border-[#B8860B]/15 shadow-2xs py-1.5"
    >
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-center">
        <div
          id="top-pill-navigation"
          className="flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-1 select-none max-w-full"
        >
          {/* 1. Homework Pill (Home page icon) */}
          <button
            id="nav-pill-homework"
            type="button"
            onClick={() => onSelectTab('homework')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2 ${
              activeTab === 'homework'
                ? 'bg-[#0E5C56] text-white shadow-xs'
                : 'bg-white text-[#1F2A3D] hover:bg-slate-50 border border-black/5'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                activeTab === 'homework'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#0E5C56] text-white'
              }`}
            >
              <Home className="w-3 h-3 text-white" />
            </span>
            <span>Homework</span>
          </button>

          {/* 2. Reading Pill (BookOpen icon) */}
          <button
            id="nav-pill-reading"
            type="button"
            onClick={() => onSelectTab('reading')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2 ${
              activeTab === 'reading'
                ? 'bg-[#0E5C56] text-white shadow-xs'
                : 'bg-white text-[#1F2A3D] hover:bg-slate-50 border border-black/5'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                activeTab === 'reading'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#0E5C56] text-white'
              }`}
            >
              <BookOpen className="w-3 h-3 text-white" />
            </span>
            <span>Reading</span>
          </button>

          {/* 3. Memorization summary Pill */}
          <button
            id="nav-pill-summary"
            type="button"
            onClick={() => onSelectTab('summary')}
            className={`px-4 sm:px-5 py-2 rounded-full font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 ${
              activeTab === 'summary'
                ? 'bg-[#0E5C56] text-white shadow-xs'
                : 'bg-white text-[#1F2A3D] hover:bg-slate-50 border border-black/5'
            }`}
            title="Open Memorization Summary (114 Surahs Tracker)"
          >
            Memorization summary
          </button>

          {/* 4. Focus Notes Pill */}
          <button
            id="nav-pill-notes"
            type="button"
            onClick={() => onSelectTab('focus')}
            className={`relative px-4 sm:px-5 py-2 rounded-full font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 ${
              activeTab === 'focus'
                ? 'bg-[#0E5C56] text-white shadow-xs'
                : 'bg-white text-[#1F2A3D] hover:bg-slate-50 border border-black/5'
            }`}
            title="Open Focus Notes & Guidance"
          >
            <span>Focus Notes</span>
            {unreadCount > 0 && (
              <span
                id="notes-count-badge"
                className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full inline-flex items-center justify-center tabular-nums ${
                  activeTab === 'focus'
                    ? 'bg-white text-[#0E5C56]'
                    : 'bg-[#A32D2D] text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
    2. READING CARD COMPONENT (Rendered inside main when activeTab === 'reading')
   ========================================================================= */
interface StudentReadingCardProps {
  student: Student | null;
  onSelectTab: (tab: 'homework' | 'reading') => void;
  onOpenNotes?: () => void;
  isTeacherMode?: boolean;
  onUpdateStudentTilawa?: (studentId: string, surahNumber: number, ayahNumber: number) => void;
}

export const StudentReadingCard: React.FC<StudentReadingCardProps> = ({
  student,
  onSelectTab,
  isTeacherMode,
  onUpdateStudentTilawa,
}) => {
  if (!student) return null;

  const currentSurahNumber = student.tilawaSurah || 33;
  const currentSurah: QuranSurah =
    QURAN_SURAHS.find((s) => s.number === currentSurahNumber) ||
    QURAN_SURAHS[32] ||
    QURAN_SURAHS[0];
  const currentAyah = Math.min(student.tilawaAyah || 54, currentSurah.ayahCount);

  const handleSurahChange = (newSurahNum: number) => {
    const targetSurah = QURAN_SURAHS.find((s) => s.number === newSurahNum);
    const maxAyah = targetSurah?.ayahCount || 1;
    const newAyah = Math.min(currentAyah, maxAyah);
    if (student && onUpdateStudentTilawa) {
      onUpdateStudentTilawa(student.id, newSurahNum, newAyah);
    }
  };

  const handleAyahChange = (newAyahNum: number) => {
    if (student && onUpdateStudentTilawa) {
      onUpdateStudentTilawa(student.id, currentSurahNumber, newAyahNum);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(2, (currentAyah / currentSurah.ayahCount) * 100)
  );

  return (
    <div className="w-full pt-1 pb-4">
      <div className="w-full bg-white rounded-[26px] p-5 sm:p-6 shadow-xs border border-[#B8860B]/20 flex flex-col space-y-3">
        {/* Top Dropdowns: Select Surah & Ayah */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Select Surah */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6478] mb-1.5 font-sans">
              Select Surah:
            </label>
            <div className="relative">
              <select
                value={currentSurahNumber}
                onChange={(e) => handleSurahChange(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-[#B8860B]/40 hover:border-[#B8860B] rounded-xl py-2 pl-3 pr-8 text-xs sm:text-sm font-bold text-[#0E5C56] font-sans focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 transition-all cursor-pointer shadow-2xs truncate"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.arabicName})
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="w-4 h-4 text-[#0E5C56] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Select Ayah */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6478] mb-1.5 font-sans">
              Ayah:
            </label>
            <div className="relative">
              <select
                value={currentAyah}
                onChange={(e) => handleAyahChange(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-[#B8860B]/40 hover:border-[#B8860B] rounded-xl py-2 pl-3 pr-8 text-xs sm:text-sm font-bold text-[#0E5C56] font-sans focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 transition-all cursor-pointer shadow-2xs"
              >
                {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((a) => (
                  <option key={a} value={a}>
                    Ayah {a}
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="w-4 h-4 text-[#0E5C56] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-[#F2ECE1] my-1" />

        {/* Big Centered Arabic Surah Name, English Subtitle & Ayah Counter */}
        <div className="flex flex-col items-center justify-center text-center py-2 space-y-1 select-none">
          {/* Big Calligraphic Arabic Name */}
          <h2
            dir="rtl"
            className="font-arabic font-extrabold text-4xl sm:text-5xl text-[#0E5C56] leading-tight"
          >
            {currentSurah.arabicName}
          </h2>

          {/* English Surah Name */}
          <p className="text-sm font-semibold text-[#5B6478] font-sans">
            {currentSurah.name}
          </p>

          {/* Ayah display: Ayah [54 in bold gold] / 73 */}
          <div className="flex items-baseline justify-center gap-1.5 pt-2 text-[#5B6478] font-sans font-medium text-base sm:text-lg">
            <span>Ayah</span>
            <span className="text-3xl sm:text-4xl font-black text-[#B8860B] leading-none">
              {currentAyah}
            </span>
            <span className="text-base text-[#5B6478]">
              / {currentSurah.ayahCount}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full pt-4 px-1">
            <div className="w-full h-3 sm:h-3.5 bg-[#F5EFDD] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#0E5C56] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Return to Homework Link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSelectTab('homework')}
            className="text-xs font-bold text-[#0E5C56] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homework</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
    3. BACKWARDS-COMPATIBLE WRAPPER
   ========================================================================= */
interface StudentTopSectionProps {
  student: Student | null;
  activeTab: 'homework' | 'reading';
  onSelectTab: (tab: 'homework' | 'reading') => void;
  onOpenSummary: () => void;
  onOpenNotes: () => void;
  isTeacherMode?: boolean;
  onUpdateStudentTilawa?: (studentId: string, surahNumber: number, ayahNumber: number) => void;
}

export const StudentTopSection: React.FC<StudentTopSectionProps> = ({
  student,
  activeTab,
  onSelectTab,
  onOpenSummary,
  onOpenNotes,
  isTeacherMode,
  onUpdateStudentTilawa,
}) => {
  const unreadCount = student?.memorizationFocus
    ? student.memorizationFocus.split('\n').filter((l) => l.trim().length > 0).length
    : 0;

  return (
    <>
      <StudentTopNavPills
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenSummary={onOpenSummary}
        onOpenNotes={onOpenNotes}
        unreadCount={unreadCount}
      />
      {activeTab === 'reading' && (
        <StudentReadingCard
          student={student}
          onSelectTab={onSelectTab}
          onOpenNotes={onOpenNotes}
          isTeacherMode={isTeacherMode}
          onUpdateStudentTilawa={onUpdateStudentTilawa}
        />
      )}
    </>
  );
};
