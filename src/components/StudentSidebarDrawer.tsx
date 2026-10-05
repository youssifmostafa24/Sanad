import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Settings,
  ChevronRight,
  Target,
  Home,
  Bookmark,
  Share2,
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
  onOpenFocusNotes?: (student: Student) => void;
}

export const StudentSidebarDrawer: React.FC<StudentSidebarDrawerProps> = ({
  isOpen,
  onClose,
  student,
  isTeacherMode,
  onOpenSurahProgress,
  onOpenPortal,
  onOpenStudentSettings,
  onOpenFocusNotes,
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

  // Count active focus notes/bullet points if present
  const focusPointsCount = student.memorizationFocus
    ? student.memorizationFocus.split('\n').filter((l) => l.trim().length > 0).length
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="student-sidebar-portal" className="fixed inset-0 z-50 overflow-hidden" dir="ltr">
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

          {/* Slide-out Drawer Panel (From Left Side for LTR) */}
          <motion.div
            id="sidebar-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 bottom-0 left-0 w-88 sm:w-96 max-w-[92vw] bg-[#FAF6EE] text-[#1F2A3D] shadow-2xl z-50 flex flex-col border-r border-[#B8860B]/25 overflow-y-auto"
          >
            {/* Drawer Header: Teal top section matching design */}
            <div className="bg-[#0E5C56] text-white px-5 py-4 flex items-center justify-between border-b border-[#B8860B]/30 shadow-xs shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Student Avatar / Photo */}
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-sans font-bold text-lg shadow-md shrink-0 border-2 border-[#B8860B]"
                  style={{ backgroundColor: student.color || '#8B5CF6' }}
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: student.photoPosition || 'center 20%',
                        transform: student.photoZoom ? `scale(${student.photoZoom})` : undefined,
                      }}
                    />
                  ) : (
                    student.name.charAt(0)
                  )}
                </div>

                {/* Student Name */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-sans font-bold text-base sm:text-lg text-white truncate">
                      {student.name}
                    </h2>
                    {student.arabicName && (
                      <span className="text-xs sm:text-sm text-white/85 font-serif">
                        ({student.arabicName})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button: Rounded Square matching design */}
              <button
                id="close-sidebar-btn"
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between" id="student-sidebar-content">
              <div className="space-y-4">
                {/* =========================================================================
                    Section 1: Current reading position (Header + Hero Card)
                   ========================================================================= */}
                <section id="section-current-reading" className="space-y-2.5">
                  {/* Row: Title & Bookmark Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#1F2A3D]">
                      <BookOpen className="w-4.5 h-4.5 text-[#8C6700] shrink-0" />
                      <h3 className="text-sm font-bold text-[#1F2A3D] font-sans">
                        Current reading position
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFocusNotes?.(student);
                      }}
                      aria-label="Bookmark reading position"
                      title="Open Reading Position & Bookmark"
                      className="w-10 h-10 rounded-2xl bg-[#F5EFDD] hover:bg-[#EBDDBB] border border-[#B8860B]/30 flex items-center justify-center text-[#8C6700] hover:text-[#5E4500] hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
                    >
                      <Bookmark className="w-5 h-5 fill-[#B8860B]/25 text-[#8C6700]" />
                    </button>
                  </div>

                  {/* Hero Reading Card: Split Surah (Left) & Ayah (Right) */}
                  <div
                    onClick={() => {
                      onClose();
                      onOpenFocusNotes?.(student);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClose();
                        onOpenFocusNotes?.(student);
                      }
                    }}
                    className="bg-white rounded-3xl border border-[#B8860B]/25 p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#B8860B]/50 hover:shadow-sm transition-all group"
                  >
                    {/* Left: Surah Name */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center pr-3">
                      <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#0E5C56] tracking-tight leading-tight select-none group-hover:scale-105 transition-transform">
                        {currentSurah.arabicName}
                      </h2>
                      <p className="text-xs font-semibold text-[#5B6478] mt-1">
                        {currentSurah.name}
                      </p>
                    </div>

                    {/* Vertical Divider */}
                    <div className="h-12 w-[1px] bg-[#B8860B]/20 shrink-0" />

                    {/* Right: Ayah Number */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center pl-3">
                      <span className="text-xs font-medium text-[#5B6478]">
                        Ayah
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-[#B8860B] font-mono leading-tight mt-0.5">
                        {currentAyah}
                      </span>
                    </div>
                  </div>
                </section>

                {/* =========================================================================
                    Section 2: Grouped Navigation Card (Focus notes, Surah tracker, Settings)
                   ========================================================================= */}
                <section id="section-nav-grouped-card">
                  <div className="bg-white rounded-3xl border border-[#B8860B]/25 shadow-xs divide-y divide-[#B8860B]/15 overflow-hidden">
                    {/* Row 1: Focus notes */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFocusNotes?.(student);
                      }}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF6EE]/80 transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0E5C56]/10 flex items-center justify-center text-[#0E5C56] group-hover:scale-105 transition-transform shrink-0">
                          <Target className="w-5 h-5 text-[#0E5C56]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[#1F2A3D] block truncate">
                            Focus notes
                          </span>
                          <span className="text-xs text-[#5B6478] block truncate">
                            Review points from your teacher
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {focusPointsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F5EFDD] text-[#8C6700] text-xs font-bold font-mono shadow-2xs">
                            {focusPointsCount}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#B8860B] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>

                    {/* Row 2: Surah tracker */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSurahProgress?.(student);
                      }}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF6EE]/80 transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] group-hover:scale-105 transition-transform shrink-0">
                          <BookOpen className="w-5 h-5 text-[#B8860B]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[#1F2A3D] block truncate">
                            Surah tracker
                          </span>
                          <span className="text-xs text-[#5B6478] block truncate">
                            Memorization status for all 114
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <ChevronRight className="w-4 h-4 text-[#B8860B] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>

                    {/* Row 3: Student settings (Teacher only) */}
                    {isTeacherMode && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenStudentSettings?.(student);
                        }}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF6EE]/80 transition-colors cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#5B6478]/10 flex items-center justify-center text-[#5B6478] group-hover:scale-105 transition-transform shrink-0">
                            <Settings className="w-5 h-5 text-[#5B6478]" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#1F2A3D] block truncate">
                              Student settings
                            </span>
                            <span className="text-xs text-[#5B6478] block truncate">
                              Photo, attendance, share link
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Share2 className="w-3.5 h-3.5 text-[#5B6478]/40" />
                          <ChevronRight className="w-4 h-4 text-[#B8860B] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    )}
                  </div>
                </section>
              </div>

              {/* =========================================================================
                  Section 3: Bottom Divider & "All families" Action Card
                 ========================================================================= */}
              <div className="pt-4 mt-auto">
                <div className="border-t border-[#B8860B]/20 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPortal?.();
                    }}
                    className="w-full bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF6EE] hover:border-[#B8860B]/40 transition-all cursor-pointer shadow-2xs group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] group-hover:scale-105 transition-transform shrink-0">
                        <Home className="w-4.5 h-4.5 text-[#B8860B]" />
                      </div>
                      <span className="font-bold text-sm text-[#1F2A3D]">
                        All families
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#B8860B] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
