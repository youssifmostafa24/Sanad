import React from 'react';
import { Student } from '../types';

interface StudentSwitcherProps {
  students: Student[];
  activeStudentId: string;
  onSelectStudent: (studentId: string) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
}) => {
  if (students.length === 0) return null;

  return (
    <footer
      id="student-bottom-switcher"
      aria-label="Student Selection"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#F5EFDD] flex items-center justify-center border-t border-[#B8860B]/20 shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] h-15 sm:h-16"
      dir="ltr"
    >
      <div className="h-full w-full flex items-center justify-center px-2 sm:px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5 px-1 no-scrollbar w-full">
          {students.map((student) => {
            const isActive = student.id === activeStudentId;
            const displayName = student.name;
            const initial = displayName.charAt(0);

            return (
              <button
                key={student.id}
                id={`student-tab-${student.id}`}
                type="button"
                onClick={() => onSelectStudent(student.id)}
                className={`rounded-full shrink-0 transition-all duration-200 cursor-pointer active:scale-95 select-none flex items-center justify-center ${
                  isActive
                    ? 'gap-2 px-4.5 sm:px-5 py-2 sm:py-2.5 bg-[#B8860B] text-[#FBF6E8] shadow-lg scale-105 sm:scale-110 ring-2 ring-[#B8860B]/70 font-black z-10 -translate-y-0.5'
                    : 'gap-1.5 px-3 py-1.5 bg-[#0E5C56] text-[#F1E7CE]/90 hover:text-white hover:bg-[#0B4D48] font-bold opacity-85 hover:opacity-100'
                }`}
              >
                {/* Circular Avatar: slightly enlarged to match typography */}
                <div
                  className={`rounded-full overflow-hidden flex items-center justify-center text-white shrink-0 border border-white/50 shadow-2xs transition-all ${
                    isActive
                      ? 'w-7.5 h-7.5 sm:w-8 sm:h-8 text-xs sm:text-sm font-black ring-1.5 ring-white/70'
                      : 'w-6 h-6 sm:w-6.5 sm:h-6.5 text-[11px] sm:text-xs font-bold'
                  }`}
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: student.photoPosition || 'center 20%',
                        transform: student.photoZoom ? `scale(${student.photoZoom})` : undefined,
                      }}
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Typography: font size slightly increased for names */}
                <span
                  className={`tracking-tight font-sans transition-all leading-none ${
                    isActive
                      ? 'text-base sm:text-lg font-black text-white drop-shadow-2xs'
                      : 'text-[14px] sm:text-[15px] font-bold text-[#F1E7CE]'
                  }`}
                >
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
