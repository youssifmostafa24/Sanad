import React, { useState, useRef, useEffect } from 'react';
import { Menu, Mic, Database, KeyRound, Shield } from 'lucide-react';
import { AuthState, Family } from '../types';
import { authenticateWithPassword } from '../utils/authUtils';

interface HeaderProps {
  authState: AuthState;
  activeFamily: Family | null;
  families: Family[];
  onLoginSuccess: (auth: AuthState) => void;
  onLogout: () => void;
  onResetData?: () => void;
  visible: boolean;
  onOpenSidebar: () => void;
  activeStudentName?: string;
  onOpenPortal: () => void;
  onOpenVoiceDictation?: () => void;
  isSupabaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  authState,
  activeFamily,
  families,
  onLoginSuccess,
  onLogout,
  visible,
  onOpenSidebar,
  activeStudentName,
  onOpenPortal,
  onOpenVoiceDictation,
  isSupabaseConnected,
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [promptTarget, setPromptTarget] = useState<'login' | 'portal'>('login');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (showPasswordPrompt) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPassword('');
      setErrorMsg('');
    }
  }, [showPasswordPrompt]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const resolvedAuth = await authenticateWithPassword(password, families);
      if (resolvedAuth) {
        setShowPasswordPrompt(false);
        setPassword('');
        setErrorMsg('');
        onLoginSuccess(resolvedAuth);
        if (promptTarget === 'portal' && resolvedAuth.role === 'teacher') {
          onOpenPortal();
        }
      } else {
        setErrorMsg('Incorrect password');
        inputRef.current?.select();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePortalClick = () => {
    if (authState.role === 'teacher') {
      onOpenPortal();
    } else if (authState.role === 'parent') {
      return;
    } else {
      setPromptTarget('portal');
      setShowPasswordPrompt(true);
    }
  };

  const isTeacher = authState.role === 'teacher';
  const isParent = authState.role === 'parent';
  const canEditCurrentFamily =
    isTeacher || (isParent && activeFamily && authState.scopedFamilyId === activeFamily.id);

  return (
    <header
      id="sanad-main-header"
      className="shrink-0 w-full z-40 h-13 sm:h-14 bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] shadow-md flex flex-col justify-between"
    >
      {/* Decorative top gold line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B8860B]/80 to-transparent w-full" />

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 flex-1 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu, Portal Logo & Student Name */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 select-none" id="brand-container">
          {/* Hamburger Menu Button */}
          <button
            id="hamburger-sidebar-btn"
            type="button"
            onClick={onOpenSidebar}
            aria-label="Student Menu"
            title="Student Menu & Settings"
            className="p-1.5 -ml-1 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer flex items-center justify-center group shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-105" />
          </button>

          {/* Main Portal Button with Quran Homework Logo */}
          <button
            id="portal-home-nav-btn"
            type="button"
            onClick={handlePortalClick}
            aria-label="Main Portal - Quran Homework"
            title={
              isParent
                ? 'Parent view (Scoped to family)'
                : isTeacher
                ? 'Main Portal (All Families)'
                : 'Main Portal / Login'
            }
            className={`p-0.5 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center group shrink-0 ${
              isParent ? 'opacity-80 cursor-default' : 'cursor-pointer'
            }`}
          >
            <img
              src="/logo.png"
              alt="Quran Homework Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#B8860B] shadow-xs"
            />
          </button>

          {/* Student Name */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1E7CE] truncate max-w-[160px] sm:max-w-xs font-sans">
              {activeStudentName || 'Student'}
            </h1>
          </div>
        </div>

        {/* Right Action Controls: Matching user screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Voice AI Button for Teacher/Parent */}
          {canEditCurrentFamily && onOpenVoiceDictation && (
            <button
              id="voice-dictation-header-btn"
              type="button"
              onClick={onOpenVoiceDictation}
              className="px-2.5 py-1 bg-gradient-to-r from-[#B8860B] to-[#976D07] hover:brightness-110 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
              title="Voice Dictation with AI"
            >
              <Mic className="w-3.5 h-3.5 text-[#F1E7CE] animate-pulse" />
              <span className="hidden sm:inline">Voice AI</span>
            </button>
          )}

          {/* Database Icon with Green Indicator Dot */}
          <div className="relative">
            <div
              id="database-status-indicator"
              className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-[#E5C378] flex items-center justify-center shadow-2xs select-none"
              title={isOnline ? 'Database Connected & Saved' : 'Reconnecting...'}
            >
              <Database className="w-4 h-4 text-[#E5C378]" />
              <span
                className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#0E5C56] ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </div>
          </div>

          {/* Key Login / Teacher Button (Matching image) */}
          <div className="relative">
            {isTeacher ? (
              <div className="flex items-center gap-1 bg-[#B8860B]/25 border border-[#B8860B]/60 rounded-xl p-0.5 pl-2 shadow-xs">
                <span className="text-xs font-bold text-[#F1E7CE] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#E5C378]" />
                  <span>Teacher</span>
                </span>
                <button
                  id="back-to-student-btn"
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-0.5 bg-[#B8860B] hover:bg-[#9B7008] text-white rounded-lg text-[11px] font-bold tracking-wide transition-colors cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 ml-1"
                  title="Exit Teacher Mode"
                >
                  Exit
                </button>
              </div>
            ) : isParent ? (
              <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-400/50 rounded-xl p-0.5 pl-2 shadow-xs">
                <span className="text-xs font-bold text-emerald-200">Parent</span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold tracking-wide transition-colors cursor-pointer shadow-2xs ml-1"
                  title="Exit Parent Mode"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                type="button"
                onClick={() => {
                  setPromptTarget('login');
                  setShowPasswordPrompt(true);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Login as Teacher or Parent"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Login</span>
              </button>
            )}

            {/* Password Prompt Popover */}
            {showPasswordPrompt && (
              <div
                id="teacher-password-popover"
                className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-[#0A423E] border border-[#B8860B]/40 rounded-xl shadow-2xl z-50 text-[#F1E7CE] animate-in fade-in zoom-in-95 duration-100"
              >
                <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B8860B] uppercase tracking-wider">
                      {promptTarget === 'portal' ? 'Main Portal Access' : 'Teacher Access'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#F1E7CE]/80 leading-tight">
                    Enter teacher password to enable edit mode
                  </p>

                  <input
                    ref={inputRef}
                    id="teacher-password-input"
                    type="password"
                    disabled={isVerifying}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Password..."
                    className="w-full px-3 py-1.5 text-xs bg-black/30 border border-[#B8860B]/30 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#B8860B] text-center font-mono"
                  />

                  {errorMsg && (
                    <p className="text-[11px] text-[#F87171] font-medium text-center">
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordPrompt(false)}
                      className="px-2.5 py-1 text-xs text-[#F1E7CE]/70 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="teacher-password-submit-btn"
                      type="submit"
                      disabled={isVerifying}
                      className="px-3 py-1 text-xs font-bold bg-[#B8860B] hover:bg-[#9B7008] text-white rounded-lg cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isVerifying ? 'Checking...' : 'Unlock'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
