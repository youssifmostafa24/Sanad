import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Target,
  Sparkles,
  Check,
  Edit3,
  Eye,
  Info,
  Save,
} from 'lucide-react';
import { Student } from '../types';
import { QURAN_SURAHS, QuranSurah } from '../data/quranSurahs';

interface StudentFocusNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  isTeacherMode: boolean;
  onSaveFocusNotes: (
    studentId: string,
    memorizationFocus: string,
    tilawaSurah: number,
    tilawaAyah: number,
    motivationalMessage?: string
  ) => void;
}

const QUICK_FOCUS_TAGS = [
  'Similar Verses (المتشابهات)',
  'Articulation & Letters (مخارج الحروف)',
  'Solidify Past Memorization (تثبيت الحفظ القديم)',
  'Tajweed & Madd Rules (أحكام التجويد والمدود)',
  'Recite with Calm Pace (التأني وتجنب السرعة)',
  'Review Previous Quarter (مراجعة الربع الأخير)',
  'Verse Endings & Connecting (رؤوس الآيات والوصل)',
];

export const StudentFocusNotesModal: React.FC<StudentFocusNotesModalProps> = ({
  isOpen,
  onClose,
  student,
  isTeacherMode,
  onSaveFocusNotes,
}) => {
  const [focusNotes, setFocusNotes] = useState(student.memorizationFocus || '');
  const [motivationalMessage, setMotivationalMessage] = useState(student.motivationalMessage || '');
  const [selectedSurahNum, setSelectedSurahNum] = useState(student.tilawaSurah || 18);
  const [selectedAyahNum, setSelectedAyahNum] = useState(student.tilawaAyah || 1);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setFocusNotes(student.memorizationFocus || '');
    setMotivationalMessage(student.motivationalMessage || '');
    setSelectedSurahNum(student.tilawaSurah || 18);
    setSelectedAyahNum(student.tilawaAyah || 1);
  }, [student, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSurah: QuranSurah =
    QURAN_SURAHS.find((s) => s.number === selectedSurahNum) || QURAN_SURAHS[0];

  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNum(surahNum);
    const targetSurah = QURAN_SURAHS.find((s) => s.number === surahNum);
    const maxAyahs = targetSurah ? targetSurah.ayahCount : 7;
    if (selectedAyahNum > maxAyahs) {
      setSelectedAyahNum(1);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!isTeacherMode) return;
    setFocusNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}\n• ${tag}`;
    });
  };

  const handleSave = () => {
    onSaveFocusNotes(student.id, focusNotes, selectedSurahNum, selectedAyahNum, motivationalMessage);
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div
        id="student-focus-notes-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
        dir="ltr"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          id="student-focus-notes-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#FAF6EE] text-[#1F2A3D] rounded-3xl shadow-2xl border border-[#B8860B]/35 overflow-hidden flex flex-col my-auto z-10 max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] px-5 py-4 flex items-center justify-between border-b border-[#B8860B]/40 shadow-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Student Photo / Avatar */}
              <div
                className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-sans font-bold text-lg shadow-md shrink-0 border-2 border-[#B8860B]"
                style={{ backgroundColor: student.color || '#0E5C56' }}
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

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-sans font-bold text-base text-[#F1E7CE] truncate">
                    {student.name}
                  </h2>
                  {student.arabicName && (
                    <span className="text-xs text-[#F1E7CE]/90 font-serif">
                      ({student.arabicName})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#B8860B] font-sans truncate flex items-center gap-1.5 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>Memorization Focus & Current Recitation</span>
                </p>
              </div>
            </div>

            {/* Mode Indicator & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs ${
                  isTeacherMode
                    ? 'bg-[#B8860B] text-white'
                    : 'bg-white/20 text-[#F1E7CE] border border-white/30'
                }`}
              >
                {isTeacherMode ? (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Mode</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>View Only</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* =========================================================================
                Section 1: Memorization Focus Points & Notes
               ========================================================================= */}
            <section id="section-memorization-focus" className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#0E5C56]">
                  <Target className="w-4.5 h-4.5 text-[#B8860B]" />
                  <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                    Memorization Focus Points & Notes
                  </h3>
                </div>
                {isTeacherMode ? (
                  <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/15 px-2.5 py-0.5 rounded-full">
                    Editable
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#8A6305] bg-[#B8860B]/15 px-2.5 py-0.5 rounded-full">
                    Teacher's Guidance
                  </span>
                )}
              </div>

              {isTeacherMode ? (
                /* Teacher Mode: Editable Textarea + Quick Suggestion Tags */
                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div>
                    <label
                      htmlFor="memorization-focus-textarea"
                      className="block text-xs font-semibold text-[#5B6478] mb-1.5"
                    >
                      Write key areas the student needs to focus on and strengthen:
                    </label>
                    <textarea
                      id="memorization-focus-textarea"
                      rows={4}
                      value={focusNotes}
                      onChange={(e) => setFocusNotes(e.target.value)}
                      placeholder="e.g. Focus on articulation points (Makharij), master similar verses in Surah Al-Baqarah, maintain proper Madd rules, recite calmly..."
                      className="w-full bg-[#FAF6EE]/80 border border-[#B8860B]/30 rounded-xl p-3 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#8A94A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56] transition-all resize-y leading-relaxed font-sans"
                    />
                  </div>

                  {/* Quick Shortcut Tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#5B6478] block">
                      Quick suggestions (click to add):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_FOCUS_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#F3EAD3] text-[#0E5C56] border border-[#B8860B]/30 font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#B8860B]" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Student Mode: Read-Only View */
                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-4 shadow-2xs space-y-2.5">
                  {focusNotes.trim() ? (
                    <div className="bg-gradient-to-br from-[#FAF6EE] to-[#F3EAD3]/60 p-3.5 rounded-xl border border-[#B8860B]/30">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4.5 h-4.5 text-[#B8860B] shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-[#1F2A3D] leading-relaxed whitespace-pre-line font-medium flex-1">
                          {focusNotes}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#FAF6EE]/60 border border-dashed border-[#B8860B]/30 text-center space-y-1">
                      <Info className="w-5 h-5 mx-auto text-[#B8860B]" />
                      <p className="text-xs font-semibold text-[#0E5C56]">
                        No specific focus notes recorded at this time
                      </p>
                      <p className="text-[11px] text-[#5B6478]">
                        Keep up the excellent recitation and consistent daily review!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* =========================================================================
                Section 2: Current Recitation (Tilawa)
               ========================================================================= */}
            <section id="section-tilawa-surah-focus" className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#0E5C56]">
                  <BookOpen className="w-4.5 h-4.5 text-[#B8860B]" />
                  <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                    Current Recitation (Tilawa)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#8A6305] bg-[#B8860B]/15 px-2.5 py-0.5 rounded-full">
                  Bookmark
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                {isTeacherMode ? (
                  <>
                    <div className="flex items-center gap-2 w-full">
                      {/* Surah Dropdown */}
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="focus-tilawa-surah"
                          className="block text-[10px] font-bold text-[#5B6478] mb-1"
                        >
                          Surah:
                        </label>
                        <select
                          id="focus-tilawa-surah"
                          value={selectedSurahNum}
                          onChange={(e) => handleSurahChange(Number(e.target.value))}
                          className="w-full bg-[#FAF6EE] border border-[#B8860B]/35 rounded-xl py-2 px-2 text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/30 cursor-pointer shadow-2xs truncate"
                        >
                          {QURAN_SURAHS.map((s) => (
                            <option key={`focus-s-${s.number}`} value={s.number}>
                              {s.number}. {s.name} ({s.arabicName})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ayah Dropdown */}
                      <div className="w-28 sm:w-32 shrink-0">
                        <label
                          htmlFor="focus-tilawa-ayah"
                          className="block text-[10px] font-bold text-[#5B6478] mb-1"
                        >
                          Ayah (of {currentSurah.ayahCount}):
                        </label>
                        <select
                          id="focus-tilawa-ayah"
                          value={selectedAyahNum}
                          onChange={(e) => setSelectedAyahNum(Number(e.target.value))}
                          className="w-full bg-[#FAF6EE] border border-[#B8860B]/35 rounded-xl py-2 px-1 text-center text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/30 cursor-pointer shadow-2xs"
                        >
                          {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => (
                            <option key={`focus-a-${n}`} value={n}>
                              Ayah {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Visual Badge Preview */}
                    <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#B8860B]/20 flex items-center justify-between text-xs text-[#0E5C56]">
                      <span className="font-medium text-[#5B6478]">Current bookmark:</span>
                      <span className="font-bold text-[#0E5C56]">
                        Surah {currentSurah.name} ({currentSurah.arabicName}) — Ayah {selectedAyahNum}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Student View: Read-Only */
                  <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#B8860B]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-center font-bold text-xs shadow-2xs">
                        {currentSurah.number}
                      </div>
                      <div>
                        <span className="text-[11px] text-[#5B6478] block">Current Recitation:</span>
                        <span className="text-sm font-bold text-[#0E5C56]">
                          Surah {currentSurah.name} ({currentSurah.arabicName})
                        </span>
                      </div>
                    </div>

                    <div className="text-center bg-white px-3.5 py-1.5 rounded-xl border border-[#B8860B]/30 shadow-2xs">
                      <span className="text-[10px] text-[#5B6478] block font-medium">Ayah</span>
                      <span className="text-sm font-bold text-[#B8860B] font-mono">
                        {selectedAyahNum} <span className="text-[#5B6478] text-xs font-normal">/ {currentSurah.ayahCount}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* =========================================================================
                Section 3: Weekly Stars Motivational Message (Custom Teacher Message)
               ========================================================================= */}
            <section id="section-weekly-motivational-message" className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#0E5C56]">
                  <Sparkles className="w-4.5 h-4.5 text-[#F98326]" />
                  <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                    Weekly Star Card & Motivational Message
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#EA580C] bg-[#F98326]/15 px-2.5 py-0.5 rounded-full">
                  {isTeacherMode ? 'Editable' : 'Weekly Banner'}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-[#F98326]/30 p-3.5 sm:p-4 shadow-2xs space-y-3">
                {isTeacherMode ? (
                  <div>
                    <label
                      htmlFor="motivational-message-input"
                      className="block text-xs font-semibold text-[#5B6478] mb-1.5"
                    >
                      Enter a custom encouraging message displayed on the student's weekly stars banner:
                    </label>
                    <input
                      id="motivational-message-input"
                      type="text"
                      value={motivationalMessage}
                      onChange={(e) => setMotivationalMessage(e.target.value)}
                      placeholder="e.g. Log every day to unlock the 5th star / ممتاز يا بطل استمر في الحفظ!"
                      className="w-full bg-[#FAF6EE]/80 border border-[#F98326]/40 rounded-xl p-3 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#8A94A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F98326] transition-all font-sans"
                    />
                    <p className="text-[11px] text-[#5B6478] mt-1.5">
                      This message appears directly on the orange weekly star banner (This week so far).
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-[#F98326] to-[#EE5D2A] text-white p-3.5 rounded-xl shadow-xs">
                    <p className="text-xs font-bold text-white/85">Current Encouragement:</p>
                    <p className="text-sm font-bold mt-1 text-white">
                      {motivationalMessage.trim() || 'Log every day to unlock the 5th star'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 bg-[#F5EFDD] border-t border-[#B8860B]/20 flex items-center justify-between shrink-0">
            {isTeacherMode ? (
              <>
                <span className="text-[11px] text-[#5B6478] font-medium">
                  {isSavedRecently ? 'Changes saved successfully ✓' : 'Save changes to update student data'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {isSavedRecently ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#86EFAC]" />
                        <span>Saved ✓</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#B8860B]" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
