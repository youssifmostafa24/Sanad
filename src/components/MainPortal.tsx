import React, { useState } from 'react';
import { Family, Student } from '../types';
import { Check, Shield, KeyRound, Lock, Camera, Settings, CloudUpload, Loader2 } from 'lucide-react';
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
  onOpenStudentSettings?: (student: Student) => void;
  onSyncToSupabase?: () => Promise<{ success: boolean; entriesCount: number; message: string }>;
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
  onOpenStudentSettings,
  onSyncToSupabase,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (!onSyncToSupabase || isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await onSyncToSupabase();
      setSyncStatusMsg(res.message);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setSyncStatusMsg('فشلت المزامنة: ' + (err?.message || 'خطأ'));
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

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

  // Filter out any 4th family (e.g. Mostafa/Samah) and organize the 3 requested families
  const sanitizedFamilies = families
    .filter((fam) => {
      const name = fam.name.toLowerCase();
      return (
        !name.includes('mostafa') &&
        !name.includes('samah') &&
        !name.includes('مصطفى') &&
        !name.includes('مصطفي') &&
        !name.includes('سماح')
      );
    })
    .slice(0, 3);

  // Order: Sulaymn+Ibrahim+Ali, Musab+umair+Uthman, Hayaa+Yusuf
  const orderedFamilies = [...sanitizedFamilies].sort((a, b) => {
    const getOrder = (fam: Family) => {
      if (fam.id === 'family-1' || fam.name.includes('Sulaymn') || fam.name.includes('Ibrahim')) return 1;
      if (fam.id === 'family-2' || fam.name.includes('Musab') || fam.name.includes('umair')) return 2;
      if (fam.id === 'family-3' || fam.name.includes('Yusuf') || fam.name.includes('Hayaa')) return 3;
      return 4;
    };
    return getOrder(a) - getOrder(b);
  });

  const renderStudentCard = (student: Student, familyId: string) => {
    return (
      <div
        key={student.id}
        id={`portal-student-card-${student.id}`}
        onClick={() => onSelectFamilyAndStudent(familyId, student.id)}
        className="group relative flex flex-col bg-white rounded-[24px] sm:rounded-[30px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 border-2 border-white hover:border-[#B8860B]/60 active:scale-97 cursor-pointer select-none"
      >
        {/* Top Portrait Photo Container */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#FAF6EE] to-[#E9DFCA] flex items-center justify-center rounded-t-[22px] sm:rounded-t-[28px]">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              style={{
                objectPosition: student.photoPosition || 'center 20%',
                transform: student.photoZoom && student.photoZoom !== 1 ? `scale(${student.photoZoom})` : undefined,
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-3 text-white transition-all group-hover:scale-102"
              style={{
                background: `linear-gradient(145deg, ${student.color || '#0E5C56'}e6, ${student.color || '#0E5C56'})`,
              }}
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl sm:text-2xl font-bold font-sans shadow-inner">
                {student.name.charAt(0)}
              </div>
              {student.arabicName && (
                <span className="text-xs sm:text-sm text-white/95 font-serif font-bold mt-2">
                  {student.arabicName}
                </span>
              )}
            </div>
          )}

          {/* Teacher Mode Fast-Edit Button */}
          {isTeacherMode && onOpenStudentSettings && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenStudentSettings(student);
              }}
              title="تعديل صورة وإعدادات الطالب"
              className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-[#B8860B] text-white shadow-md backdrop-blur-xs transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bottom Name Area (White pill with warm gold student name matching Sulaymn.png) */}
        <div className="w-full bg-white py-2 sm:py-2.5 px-2 text-center rounded-b-[22px] sm:rounded-b-[28px] border-t border-amber-100/50">
          <span className="font-sans font-bold text-sm sm:text-base md:text-lg text-[#B8860B] group-hover:text-[#9B7008] transition-colors block truncate leading-tight">
            {student.name}
          </span>
          {student.arabicName && (
            <span className="text-[10px] sm:text-xs text-[#5B6478] font-serif block truncate mt-0.5">
              {student.arabicName}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="main-portal-view" className="min-h-screen bg-[#F5EFDD] text-[#1F2A3D] flex flex-col font-sans select-none" dir="rtl">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-[#0E5C56] via-[#0B4D48] to-[#0A423E] text-[#F1E7CE] shadow-md border-b border-[#B8860B]/40 sticky top-0 z-30">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B8860B] to-transparent w-full" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Right: Circular Logo + Site Name (Quran Homework) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/logo.png"
              alt="Quran Homework Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm border border-[#B8860B]/50 shrink-0"
            />
            <div>
              <h1 className="text-base sm:text-xl font-bold font-serif text-[#F1E7CE] tracking-tight leading-tight">
                Quran Homework
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#B8860B] font-serif leading-none mt-0.5">
                سَـنَـد القرآني · متابعة الحفظ والمراجعة
              </p>
            </div>
          </div>

          {/* Left: Teacher Status Controls */}
          <div className="flex items-center gap-2">
            {isTeacherAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-[#0A3834]/80 p-1 pl-2 rounded-xl border border-[#B8860B]/30">
                <span className="hidden sm:inline text-xs font-semibold text-[#86EFAC] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  المعلم معتمد
                </span>
                {onSyncToSupabase && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="رفع وتحديث كل الواجبات في قاعدة بيانات Supabase"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-[#0E5C56] hover:bg-[#08423E] text-white border border-[#B8860B]/40 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#B8860B]" />
                    ) : (
                      <CloudUpload className="w-3 h-3 text-[#B8860B]" />
                    )}
                    <span className="hidden md:inline">
                      {isSyncing ? 'جاري الحفظ...' : 'حفظ الكل بالسحابة'}
                    </span>
                  </button>
                )}
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

      {/* Cloud Sync Status Notification Toast */}
      {syncStatusMsg && (
        <div className="w-full bg-[#0E5C56] text-[#F1E7CE] px-4 py-2 text-center text-xs font-bold border-b border-[#B8860B]/40 animate-fade-in shadow-inner">
          {syncStatusMsg}
        </div>
      )}

      {/* Main Content Area: 3 Rows matching Sulaymn.png perfectly */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col justify-center gap-4 sm:gap-6">
        {orderedFamilies.map((fam, famIndex) => {
          // Find students belonging to this family
          const famStudents = fam.studentIds
            .map((id) => students.find((s) => s.id === id))
            .filter((s): s is Student => Boolean(s));

          // Row 1 & 2 have 3 students; Row 3 has 2 students centered
          const isTwoStudentRow = famStudents.length === 2;

          return (
            <div key={fam.id} id={`portal-family-row-${fam.id}`} className="w-full">
              {isTwoStudentRow ? (
                /* Row 3: 2 Students centered */
                <div className="flex justify-center gap-3 sm:gap-5 w-full">
                  {famStudents.map((st) => (
                    <div
                      key={st.id}
                      className="w-[calc(33.333%-0.5rem)] sm:w-[calc(33.333%-0.85rem)] max-w-[170px]"
                    >
                      {renderStudentCard(st, fam.id)}
                    </div>
                  ))}
                </div>
              ) : (
                /* Rows 1 & 2: 3 Students in a grid */
                <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-xl mx-auto">
                  {famStudents.map((st) => (
                    <div key={st.id} className="w-full">
                      {renderStudentCard(st, fam.id)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="py-3 border-t border-[#B8860B]/20 bg-[#FBF6E8]/60 text-center text-xs text-[#5B6478]">
        Quran Homework · سَـنَـد القرآني · متابعة الحفظ والمراجعة
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
