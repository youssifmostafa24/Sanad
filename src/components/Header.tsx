import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, Check, RotateCcw, Menu, Home } from 'lucide-react';
import { Family } from '../types';
import { verifyTeacherPassword } from '../utils/authUtils';

interface HeaderProps {
  isTeacherMode: boolean;
  activeFamily: Family | null;
  onEnterTeacherMode: () => void;
  onExitTeacherMode: () => void;
  onResetData?: () => void;
  visible: boolean;
  onOpenSidebar: () => void;
  activeStudentName?: string;
  onOpenPortal: () => void;
  isTeacherAuthenticated: boolean;
  onTeacherLoginSuccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isTeacherMode,
  activeFamily,
  onEnterTeacherMode,
  onExitTeacherMode,
  onResetData,
  visible,
  onOpenSidebar,
  activeStudentName,
  onOpenPortal,
  isTeacherAuthenticated,
  onTeacherLoginSuccess,
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptTarget, setPromptTarget] = useState<'teacher' | 'portal'>('teacher');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showPasswordPrompt) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPassword('');
      setErrorMsg('');
    }
  }, [showPasswordPrompt]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyTeacherPassword(password)) {
      setShowPasswordPrompt(false);
      setPassword('');
      setErrorMsg('');
      onTeacherLoginSuccess();
      if (promptTarget === 'portal') {
        onOpenPortal();
      } else {
        onEnterTeacherMode();
      }
    } else {
      setErrorMsg('كلمة المرور غير صحيحة');
      inputRef.current?.select();
    }
  };

  const handlePortalClick = () => {
    if (isTeacherAuthenticated) {
      onOpenPortal();
    } else {
      setPromptTarget('portal');
      setShowPasswordPrompt(true);
    }
  };

  const handleTeacherClick = () => {
    if (isTeacherAuthenticated) {
      onEnterTeacherMode();
    } else {
      setPromptTarget('teacher');
      setShowPasswordPrompt(true);
    }
  };

  return (
    <header
      id="sanad-main-header"
      className={`fixed top-0 left-0 right-0 z-40 h-13 sm:h-14 bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] shadow-md transition-transform duration-300 ease-in-out flex flex-col justify-between ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Decorative top gold line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B8860B]/80 to-transparent w-full" />

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 flex-1 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu, Portal Home Button & Enlarged Student Name */}
        <div className="flex items-center gap-1.5 sm:gap-2 select-none" id="brand-container">
          {/* Hamburger Menu Button (Three bars) - Placed first before Home icon */}
          <button
            id="hamburger-sidebar-btn"
            type="button"
            onClick={onOpenSidebar}
            aria-label="قائمة الطالب الحالية"
            title="بيانات وإعدادات الطالب الحالي / Student Menu"
            className="p-1.5 -ml-1 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer flex items-center justify-center group shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-105" />
          </button>

          {/* Main Portal Button ("القائمة الرئيسية") - Placed after hamburger */}
          <button
            id="portal-home-nav-btn"
            type="button"
            onClick={handlePortalClick}
            aria-label="القائمة الرئيسية للأسر"
            title="القائمة الرئيسية (الأسر) / Main Portal"
            className="p-1.5 rounded-lg text-[#B8860B] hover:text-[#F1E7CE] hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer flex items-center justify-center group shrink-0"
          >
            <Home className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform group-hover:scale-105" />
          </button>

          {/* Large Student Name */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1E7CE] truncate max-w-[160px] sm:max-w-xs">
              {activeStudentName || 'Student'}
            </h1>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Saved / Auto-save Indicator */}
          <div
            id="autosave-status-indicator"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[#86EFAC] text-[10.5px] font-bold select-none border border-[#86EFAC]/25"
            title="تم الحفظ التلقائي بنجاح"
          >
            <Check className="w-3 h-3 text-[#86EFAC] stroke-[3]" />
            <span className="font-sans">Saved</span>
          </div>

          {/* Teacher Mode Reset Demo Data */}
          {isTeacherMode && onResetData && (
            <button
              id="reset-demo-data-btn"
              type="button"
              onClick={onResetData}
              title="Reset sample homework entries"
              className="p-1.5 rounded-lg text-[#F1E7CE]/70 hover:text-white hover:bg-[#FBF6E8]/15 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Teacher / Back to student mode Button */}
          {isTeacherMode ? (
            <button
              id="back-to-student-btn"
              type="button"
              onClick={onExitTeacherMode}
              className="px-2.5 sm:px-3.5 py-1 bg-[#B8860B] hover:bg-[#9B7008] text-white rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
              title="Back to student mode"
            >
              Back to student mode
            </button>
          ) : (
            <div className="relative">
              <button
                id="teacher-login-trigger-btn"
                type="button"
                onClick={handleTeacherClick}
                className="px-2.5 sm:px-3.5 py-1 bg-[#FBF6E8]/10 hover:bg-[#FBF6E8]/20 border border-[#F1E7CE]/30 rounded-lg text-[#F1E7CE] text-xs font-bold tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Teacher</span>
              </button>

              {/* Inline Password Prompt */}
              {showPasswordPrompt && (
                <div
                  id="teacher-password-popover"
                  className="absolute right-0 mt-2 w-72 p-3.5 bg-[#0A423E] border border-[#B8860B]/40 rounded-xl shadow-2xl z-50 text-[#F1E7CE]"
                >
                  <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#B8860B] uppercase tracking-wider">
                        {promptTarget === 'portal' ? 'القائمة الرئيسية' : 'Teacher Access'}
                      </span>
                    </div>

                    <input
                      ref={inputRef}
                      id="teacher-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="أدخل كلمة المرور..."
                      className="w-full px-3 py-1.5 text-xs bg-black/30 border border-[#B8860B]/30 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#B8860B] text-center font-mono"
                    />

                    {errorMsg && (
                      <p className="text-[11px] text-[#F87171] font-medium text-center">{errorMsg}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasswordPrompt(false)}
                        className="px-2.5 py-1 text-xs text-[#F1E7CE]/70 hover:text-white cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        id="teacher-password-submit-btn"
                        type="submit"
                        className="px-3 py-1 text-xs font-bold bg-[#B8860B] hover:bg-[#9B7008] text-white rounded-lg cursor-pointer transition-colors shadow-2xs"
                      >
                        فتح
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
