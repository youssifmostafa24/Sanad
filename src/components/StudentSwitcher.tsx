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
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#F1E7CE] flex flex-col items-center justify-center border-t border-[#B8860B]/20 shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
    >
      {/* Student tabs with bold names */}
      <div className="h-11 sm:h-12 w-full flex items-center justify-center px-3 sm:px-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-0.5 px-1 no-scrollbar">
          {students.map((student) => {
            const isActive = student.id === activeStudentId;
            const displayName = student.name;

            return (
              <button
                key={student.id}
                id={`student-tab-${student.id}`}
                type="button"
                onClick={() => onSelectStudent(student.id)}
                className={`px-4 sm:px-5 py-1 rounded-full text-xs sm:text-[13px] font-bold tracking-wide font-sans shrink-0 transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                  isActive
                    ? 'bg-[#B8860B] text-[#FBF6E8] shadow-xs scale-102'
                    : 'bg-[#0E5C56] text-[#F1E7CE]/90 hover:text-white'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
