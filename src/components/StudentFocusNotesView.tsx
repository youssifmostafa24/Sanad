import React, { useState, useEffect } from 'react';
import { Target, ArrowLeft, Check, Save } from 'lucide-react';
import { Student } from '../types';
import { StudentTopNavTab } from './StudentTopSection';

interface StudentFocusNotesViewProps {
  student: Student | null;
  onSelectTab: (tab: StudentTopNavTab) => void;
  isTeacherMode: boolean;
  onSaveFocusNotes: (
    studentId: string,
    memorizationFocus: string,
    tilawaSurah: number,
    tilawaAyah: number,
    motivationalMessage?: string
  ) => void;
}

export const StudentFocusNotesView: React.FC<StudentFocusNotesViewProps> = ({
  student,
  onSelectTab,
  isTeacherMode,
  onSaveFocusNotes,
}) => {
  if (!student) return null;

  const [focusNotes, setFocusNotes] = useState(student.memorizationFocus || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setFocusNotes(student.memorizationFocus || '');
  }, [student]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFocusNotes(
      student.id,
      focusNotes,
      student.tilawaSurah || 33,
      student.tilawaAyah || 54,
      student.motivationalMessage
    );
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2000);
  };

  return (
    <div className="w-full pt-1 pb-4">
      <div className="w-full bg-white rounded-[26px] p-5 sm:p-6 shadow-xs border border-[#B8860B]/20 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0E5C56]/10 flex items-center justify-center text-[#0E5C56]">
              <Target className="w-4.5 h-4.5 text-[#0E5C56]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0E5C56] font-sans">
                Focus Notes & Guidance
              </h3>
              <p className="text-[11px] text-[#5B6478]">
                ملاحظات ونقاط التركيز والتوجيهات للطالب
              </p>
            </div>
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

        {/* Content Form or View */}
        {isTeacherMode ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label
                htmlFor="student-focus-notes-input"
                className="block text-xs font-semibold text-[#5B6478] mb-1.5 font-sans"
              >
                Write key areas the student needs to focus on and strengthen:
              </label>
              <textarea
                id="student-focus-notes-input"
                rows={6}
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="e.g. Focus on articulation points (Makharij), master similar verses in Surah Al-Baqarah, maintain proper Madd rules, recite calmly..."
                className="w-full bg-[#FAF6EE]/80 border border-[#B8860B]/30 rounded-xl p-3.5 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#8A94A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56] transition-all resize-y leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#0E5C56] hover:bg-[#0B4A45] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                {isSavedRecently ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Focus Notes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {focusNotes.trim() ? (
              <div className="bg-[#FAF6EE] rounded-xl p-4 border border-[#B8860B]/20 text-xs sm:text-sm text-[#1F2A3D] whitespace-pre-wrap leading-relaxed font-sans">
                {focusNotes}
              </div>
            ) : (
              <div className="text-center py-8 text-xs sm:text-sm text-[#5B6478] bg-[#FAF6EE]/50 rounded-xl border border-dashed border-[#B8860B]/20">
                لا توجد ملاحظات تركيز مسجلة حالياً من المعلم.
              </div>
            )}
          </div>
        )}

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
