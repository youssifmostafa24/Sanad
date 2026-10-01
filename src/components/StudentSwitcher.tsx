import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Student } from '../types';

interface StudentSwitcherProps {
  students: Student[];
  activeStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onDoubleTapStudent?: (studentId: string) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
  onDoubleTapStudent,
}) => {
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  if (students.length === 0) return null;

  const handleTabClick = (studentId: string) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;

    // Detect double-tap on ANY student tab (active or not) within ~320ms:
    if (lastTapRef.current.id === studentId && timeDiff > 0 && timeDiff <= 320) {
      lastTapRef.current = { id: '', time: 0 };
      onDoubleTapStudent?.(studentId);
    } else {
      // First / single tap:
      lastTapRef.current = { id: studentId, time: now };
      onSelectStudent(studentId);
    }
  };

  return (
    <footer
      id="student-bottom-switcher"
      aria-label="Student Selection"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#F5EFDD] border-t border-[#B8860B]/20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] h-14 sm:h-16 flex items-center justify-center"
      dir="ltr"
    >
      <div className="h-full w-full flex items-center justify-center px-4 max-w-4xl mx-auto">
        <nav
          role="tablist"
          aria-label="Students"
          className="flex items-center justify-center gap-3 sm:gap-6 md:gap-10 overflow-x-auto no-scrollbar py-1"
        >
          {students.map((student) => {
            const isActive = student.id === activeStudentId;
            const displayName = student.name;

            return (
              <button
                key={student.id}
                id={`student-tab-${student.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleTabClick(student.id)}
                className="relative px-5 sm:px-6 py-1.5 sm:py-2 rounded-full cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0E5C56]/50 flex items-center justify-center shrink-0 transition-transform active:scale-95"
              >
                {/* Smooth horizontal moving capsule indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-student-capsule"
                    className="absolute inset-0 bg-[#0E5C56] rounded-full shadow-sm"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                      mass: 0.8,
                    }}
                  />
                )}

                {/* Student Name with smooth color transition */}
                <motion.span
                  className="relative z-10 text-base sm:text-lg font-bold tracking-tight whitespace-nowrap"
                  animate={{
                    color: isActive ? '#FFFFFF' : '#111827',
                  }}
                  transition={{
                    duration: 0.24,
                    delay: isActive ? 0.05 : 0,
                  }}
                >
                  {displayName}
                </motion.span>
              </button>
            );
          })}
        </nav>
      </div>
    </footer>
  );
};
