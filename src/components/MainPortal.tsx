import React, { useState } from 'react';
import { Family, Student } from '../types';
import { Check, Shield, KeyRound, BookOpen, Lock } from 'lucide-react';
import { verifyTeacherPassword } from '../utils/authUtils';

interface MainPortalProps {
  families: Family[];
  students: Student[];
  onSelectFamilyAndStudent: (familyId: string, studentId?: string) => void;
  isTeacherAuthenticated: boolean;
  onTeacherLoginSuccess: () => void;
  onTeacherLogout: () => void;
  isTeacherMode: boolean;
  onToggleTeacherMode: () => void;
}

export const MainPortal: React.FC<MainPortalProps> = ({
  families,
  students,
  onSelectFamilyAndStudent,
  isTeacherAuthenticated,
  onTeacherLoginSuccess,
  onTeacherLogout,
  isTeacherMode,
  onToggleTeacherMode,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyTeacherPassword(passwordInput)) {
      onTeacherLoginSuccess();
      setShowLoginModal(false);
      setPasswordInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div id="main-portal-view" className="min-h-screen bg-[#F5EFDD] text-[#1F2A3D] flex flex-col font-sans select-none" dir="rtl">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-[#0E5C56] via-[#0B4D48] to-[#0A423E] text-[#F1E7CE] shadow-md border-b border-[#B8860B]/40">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B8860B] to-transparent w-full" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FBF6E8]/15 border border-[#B8860B]/50 flex items-center justify-center text-[#B8860B] shadow-xs">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif text-[#F1E7CE] tracking-tight">
                سَـنَـد القرآنـي
              </h1>
            </div>
          </div>

          {/* Teacher Status Controls */}
          <div className="flex items-center gap-2">
            {isTeacherAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-[#0A3834]/80 p-1 pl-2 rounded-xl border border-[#B8860B]/30">
                <span className="hidden sm:inline text-xs font-semibold text-[#86EFAC] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  المعلم معتمد
                </span>
                <button
                  type="button"
                  onClick={onToggleTeacherMode}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isTeacherMode
                      ? 'bg-[#B8860B] text-white hover:bg-[#9B7008]'
                      : 'bg-white/15 text-[#F1E7CE] hover:bg-white/25'
                  }`}
                >
                  {isTeacherMode ? 'وضع المعلم (مفعّل)' : 'تفعيل وضع المعلم'}
                </button>
                <button
                  type="button"
                  onClick={onTeacherLogout}
                  title="قفل صلاحيات المعلم"
                  className="p-1 rounded-lg text-[#F1E7CE]/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="portal-teacher-login-btn"
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FBF6E8]/10 hover:bg-[#FBF6E8]/20 border border-[#F1E7CE]/30 text-[#F1E7CE] transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>دخول المعلم</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - 2 Columns on Desktop */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* 2-Column Responsive Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" id="families-slides-container">
          {families.map((fam) => {
            const famStudents = students.filter((st) => fam.studentIds.includes(st.id));

            return (
              <div
                key={fam.id}
                id={`family-slide-${fam.id}`}
                className="bg-white rounded-2xl border border-[#B8860B]/25 hover:border-[#0E5C56]/50 transition-all duration-150 shadow-2xs hover:shadow-xs p-3 sm:p-4 flex flex-col justify-center"
              >
                {/* Slide Content: Students Icons & Chips only */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {famStudents.map((student) => {
                    return (
                      <button
                        key={student.id}
                        id={`portal-student-${student.id}`}
                        type="button"
                        onClick={() => onSelectFamilyAndStudent(fam.id, student.id)}
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-[#FAF6EE]/70 hover:bg-[#FBF6E8] border border-[#B8860B]/20 hover:border-[#0E5C56] transition-all text-right cursor-pointer group/st active:scale-98 shadow-2xs hover:shadow-xs"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-2xs shrink-0"
                          style={{ backgroundColor: student.color || '#0E5C56' }}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs sm:text-[13px] text-[#1F2A3D] group-hover/st:text-[#0E5C56] transition-colors truncate block">
                            {student.name}
                          </span>
                          {student.arabicName && (
                            <span className="text-[10px] text-[#5B6478] font-serif block truncate">
                              {student.arabicName}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2.5 border-t border-[#B8860B]/20 bg-[#FBF6E8]/60 text-center text-xs text-[#5B6478]">
        سند القرآني · متابعة الحفظ والمراجعة
      </footer>

      {/* Teacher Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] text-[#1F2A3D] border border-[#B8860B]/40 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#B8860B]" />
                </div>
                <h3 className="text-base font-bold text-[#0E5C56] font-serif">
                  تسجيل دخول المعلم
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setErrorMsg('');
                  setPasswordInput('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5B6478] leading-relaxed">
              أدخل كلمة المرور لتفعيل صلاحيات المعلم.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="كلمة المرور..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#B8860B]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E5C56] text-center tracking-widest font-mono"
                />
                {errorMsg && (
                  <p className="text-xs text-red-600 mt-1 font-medium text-center">
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setErrorMsg('');
                    setPasswordInput('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0E5C56] hover:bg-[#0B4D48] text-white transition-colors cursor-pointer shadow-xs"
                >
                  تأكيد الدخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
