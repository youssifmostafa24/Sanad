import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldOff,
  Database,
  Layers,
  Calendar,
  Settings,
  RotateCcw,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { Student, AuthState } from '../types';

interface AppBottomBarProps {
  students: Student[];
  activeStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onDoubleTapStudent?: (studentId: string) => void;
  isTeacherMode: boolean;
  onToggleTeacherMode: () => void;
  onOpenTeacherLogin: () => void;
  onOpenVoiceDictation?: () => void;
  isSupabaseConnected: boolean;
  authState: AuthState;
  onLogout: () => void;
  onOpenPortal: () => void;
  onOpenAttendance?: () => void;
  onOpenStudentSettings?: (student: Student) => void;
  onResetData?: () => void;
}

export const AppBottomBar: React.FC<AppBottomBarProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
  onDoubleTapStudent,
  isTeacherMode,
  onToggleTeacherMode,
  onOpenTeacherLogin,
  onOpenVoiceDictation,
  isSupabaseConnected,
  authState,
  onLogout,
  onOpenPortal,
  onOpenAttendance,
  onOpenStudentSettings,
  onResetData,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const activeStudent = students.find((s) => s.id === activeStudentId) || null;

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleStudentClick = (studentId: string) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;

    if (lastTapRef.current.id === studentId && timeDiff > 0 && timeDiff <= 320) {
      lastTapRef.current = { id: '', time: 0 };
      onDoubleTapStudent?.(studentId);
    } else {
      lastTapRef.current = { id: studentId, time: now };
      onSelectStudent(studentId);
    }
  };

  return (
    <footer
      id="app-bottom-bar"
      aria-label="Student Switcher and Navigation"
      style={{
        backgroundColor: '#FBF8F0',
        borderColor: '#E4DCC8',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="shrink-0 w-full z-40 border-t shadow-md select-none"
      dir="ltr"
    >
      <div className="h-14 w-full flex items-center justify-between px-3 max-w-7xl mx-auto gap-2">
        {/* Left: Student Switcher (Full names, 44px pills, 15px/500 text, horizontal scrolling) */}
        <nav
          role="tablist"
          aria-label="Students"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0 pr-1"
        >
          {students.map((student) => {
            const isActive = student.id === activeStudentId;

            return (
              <button
                key={student.id}
                id={`student-tab-${student.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleStudentClick(student.id)}
                className={`h-11 px-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer select-none transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E56]/40 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F6E56] text-white shadow-xs'
                    : 'bg-transparent text-[#1F2A3D] hover:bg-black/5'
                }`}
              >
                <span className="text-[15px] font-medium leading-none whitespace-nowrap">
                  {student.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Menu Button */}
        <div className="flex items-center shrink-0 relative">
          {/* Menu Button: 40px with three-dots or solid gold circle when teacher mode is ON */}
          <div className="relative" ref={menuRef}>
            <button
              id="bottom-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isTeacherMode ? 'Teacher mode active' : 'Menu'}
              aria-expanded={isMenuOpen}
              style={{
                backgroundColor: isTeacherMode ? '#FAC775' : '#EDE4D0',
                color: isTeacherMode ? '#412402' : '#4A3E2D',
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer relative shadow-xs border border-black/10 hover:brightness-95 outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E56]/40"
            >
              {isTeacherMode ? (
                <ShieldCheck className="w-5 h-5 text-[#412402]" />
              ) : (
                <MoreVertical className="w-5 h-5 text-[#4A3E2D]" />
              )}

              {/* Status dot on the icon: green = saved/connected, amber = reconnecting */}
              <span
                id="menu-sync-dot"
                className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#FBF8F0] ${
                  isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
                title={isSupabaseConnected ? 'Saved & connected' : 'Reconnecting...'}
              />
            </button>

            {/* Dropdown Menu ABOVE the bar (anchored to the right) */}
            {isMenuOpen && (
              <div
                id="bottom-actions-dropdown"
                role="menu"
                className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E4DCC8] p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
              >
                {/* 1. Teacher Mode Toggle / Exit */}
                {isTeacherMode ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleTeacherMode();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors active:scale-98"
                  >
                    <ShieldOff className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Exit teacher mode</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (authState.role === 'teacher') {
                        onToggleTeacherMode();
                      } else {
                        onOpenTeacherLogin();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#0E5C56] hover:bg-[#EAF6EE] cursor-pointer transition-colors active:scale-98"
                  >
                    <Shield className="w-4 h-4 text-[#0E5C56] shrink-0" />
                    <span>Teacher mode</span>
                  </button>
                )}

                {/* 2. Sync Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 my-1 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sync status</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                    <span className={isSupabaseConnected ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {isSupabaseConnected ? 'Connected & saved' : 'Reconnecting...'}
                    </span>
                  </div>
                </div>

                <div className="my-1 border-t border-gray-100" />

                {/* 3. Main Portal (All Families) */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPortal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1F2A3D] hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#8C6700] shrink-0" />
                  <span>Main Portal (All Families)</span>
                </button>

                {/* 4. Student Attendance */}
                {onOpenAttendance && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAttendance();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1F2A3D] hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#0E5C56] shrink-0" />
                    <span>Student Attendance</span>
                  </button>
                )}

                {/* 5. Student Settings */}
                {activeStudent && onOpenStudentSettings && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenStudentSettings(activeStudent);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1F2A3D] hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#0E5C56] shrink-0" />
                    <span>Student Settings</span>
                  </button>
                )}

                {/* 6. Reset Demo Data */}
                {onResetData && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onResetData();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Reset Demo Data</span>
                  </button>
                )}

                {/* 7. Login / Logout */}
                <div className="pt-1 mt-1 border-t border-gray-100">
                  {authState.role !== 'student' ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Logout ({authState.role})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenTeacherLogin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0E5C56] hover:bg-[#EAF6EE] cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-[#0E5C56] shrink-0" />
                      <span>Login / Teacher Access</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
