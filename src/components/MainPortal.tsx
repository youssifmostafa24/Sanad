import React, { useState, useEffect } from 'react';
import { AuthState, Family, Student } from '../types';
import {
  Shield,
  KeyRound,
  Lock,
  CloudUpload,
  Loader2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
} from 'lucide-react';
import { authenticateWithPassword, hashPassword } from '../utils/authUtils';

interface MainPortalProps {
  families: Family[];
  students: Student[];
  onSelectFamilyAndStudent: (familyId: string, studentId?: string) => void;
  authState: AuthState;
  onLoginSuccess: (auth: AuthState) => void;
  onLogout: () => void;
  isTeacherMode: boolean;
  onToggleTeacherMode: () => void;
  onOpenStudentSettings?: (student: Student) => void;
  onSyncToSupabase?: () => Promise<{ success: boolean; entriesCount: number; message: string }>;
  onUpdateFamilyOrder?: (updatedFamilies: Family[]) => void;
  onUpdateFamilyParentPassword?: (familyId: string, passwordHash?: string) => void;
}

export const MainPortal: React.FC<MainPortalProps> = ({
  families,
  students,
  onSelectFamilyAndStudent,
  authState,
  onLoginSuccess,
  onLogout,
  isTeacherMode,
  onToggleTeacherMode,
  onOpenStudentSettings,
  onSyncToSupabase,
  onUpdateFamilyOrder,
  onUpdateFamilyParentPassword,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Confirmations
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // Parent Password Settings Modal (Teacher only)
  const [familyForPasswordModal, setFamilyForPasswordModal] = useState<Family | null>(null);
  const [newParentPassword, setNewParentPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // Auto-redirect if role is parent: parents should not view the multi-family list
  useEffect(() => {
    if (authState.role === 'parent' && authState.scopedFamilyId) {
      const myFamily = families.find((f) => f.id === authState.scopedFamilyId);
      if (myFamily && myFamily.studentIds.length > 0) {
        onSelectFamilyAndStudent(myFamily.id, myFamily.studentIds[0]);
      }
    }
  }, [authState.role, authState.scopedFamilyId, families, onSelectFamilyAndStudent]);

  if (authState.role === 'parent') {
    const myFam = families.find((f) => f.id === authState.scopedFamilyId);
    return (
      <div className="min-h-screen bg-[#F5EFDD] flex flex-col items-center justify-center p-6 text-center" dir="ltr">
        <Shield className="w-12 h-12 text-[#0E5C56] mb-3 animate-pulse" />
        <h2 className="text-lg font-bold text-[#0E5C56]">Redirecting to Family View...</h2>
        <p className="text-xs text-[#5B6478] mt-1 font-serif">حساب ولي الأمر مرتبط بعائلة {myFam?.name || ''}</p>
        <button
          onClick={() => {
            if (myFam && myFam.studentIds[0]) onSelectFamilyAndStudent(myFam.id, myFam.studentIds[0]);
          }}
          className="mt-4 px-5 py-2 bg-[#0E5C56] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          Open Family
        </button>
      </div>
    );
  }

  const executeManualSync = async () => {
    if (!onSyncToSupabase || isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    setShowSyncConfirm(false);
    try {
      const result = await onSyncToSupabase();
      setSyncStatusMsg(result.message);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch {
      setSyncStatusMsg('Failed to sync data to the cloud.');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    const resolvedAuth = await authenticateWithPassword(passwordInput, families);
    if (resolvedAuth) {
      setShowLoginModal(false);
      setPasswordInput('');
      setErrorMsg('');
      onLoginSuccess(resolvedAuth);
    } else {
      setErrorMsg('كلمة المرور غير صحيحة (Incorrect password)');
    }
  };

  const handleSaveParentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyForPasswordModal || !onUpdateFamilyParentPassword) return;

    if (!newParentPassword.trim()) {
      // Remove password
      onUpdateFamilyParentPassword(familyForPasswordModal.id, undefined);
      setPasswordSuccessMsg('Parent password removed');
    } else {
      const hashed = await hashPassword(newParentPassword.trim());
      onUpdateFamilyParentPassword(familyForPasswordModal.id, hashed);
      setPasswordSuccessMsg('Parent password saved successfully');
    }

    setTimeout(() => {
      setPasswordSuccessMsg('');
      setFamilyForPasswordModal(null);
      setNewParentPassword('');
    }, 1200);
  };

  const handleRemoveParentPassword = () => {
    if (!familyForPasswordModal || !onUpdateFamilyParentPassword) return;
    onUpdateFamilyParentPassword(familyForPasswordModal.id, undefined);
    setPasswordSuccessMsg('Parent password removed');
    setTimeout(() => {
      setPasswordSuccessMsg('');
      setFamilyForPasswordModal(null);
      setNewParentPassword('');
    }, 1000);
  };

  // Sort families dynamically by displayOrder or default index
  const sortedFamilies = [...families].sort((a, b) => {
    const orderA = a.displayOrder !== undefined ? a.displayOrder : 999;
    const orderB = b.displayOrder !== undefined ? b.displayOrder : 999;
    return orderA - orderB;
  });

  // Filter hidden families in non-teacher mode
  const visibleFamilies = sortedFamilies.filter((f) => (isTeacherMode ? true : !f.isHidden));

  const moveFamily = (famId: string, direction: 'up' | 'down') => {
    if (!onUpdateFamilyOrder) return;
    const index = sortedFamilies.findIndex((f) => f.id === famId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedFamilies.length) return;

    const newFamilies = [...sortedFamilies];
    const [moved] = newFamilies.splice(index, 1);
    newFamilies.splice(targetIndex, 0, moved);

    const reordered = newFamilies.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
    onUpdateFamilyOrder(reordered);
  };

  const toggleHideFamily = (famId: string) => {
    if (!onUpdateFamilyOrder) return;
    const updated = sortedFamilies.map((f) => {
      if (f.id === famId) {
        return { ...f, isHidden: !f.isHidden };
      }
      return f;
    });
    onUpdateFamilyOrder(updated);
  };

  const renderStudentCard = (student: Student, familyId: string) => {
    return (
      <div
        key={student.id}
        id={`portal-student-${student.id}`}
        onClick={() => onSelectFamilyAndStudent(familyId, student.id)}
        className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-[#B8860B]/30 hover:border-[#0E5C56] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-1 active:scale-98"
      >
        {/* Photo Container */}
        <div className="relative w-full aspect-square bg-[#FAF6EE] flex items-center justify-center overflow-hidden">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              style={{
                objectPosition: student.photoPosition || '50% 20%',
                transform: `scale(${student.photoZoom || 1.0})`,
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-inner"
              style={{ backgroundColor: student.color }}
            >
              {student.name.charAt(0)}
            </div>
          )}

          {/* Current Tilawa Surah & Ayah Badge */}
          {student.tilawaSurah && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-xs text-[#F1E7CE] px-2 py-0.5 rounded-full text-[10px] font-sans font-bold flex items-center gap-1 shadow-xs border border-white/20">
              <span>{student.tilawaSurah}:{student.tilawaAyah || 1}</span>
            </div>
          )}
        </div>

        {/* Bottom Student Name Badge */}
        <div className="py-2.5 sm:py-3 px-2 text-center bg-white flex flex-col items-center justify-center">
          <span className="font-sans font-bold text-sm sm:text-base text-[#0E5C56] group-hover:text-[#B8860B] transition-colors truncate max-w-full">
            {student.name}
          </span>
          {student.arabicName && (
            <span className="text-[10px] sm:text-[11px] text-[#5B6478] font-serif font-medium truncate max-w-full">
              ({student.arabicName})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="main-portal-view" className="min-h-screen bg-[#F5EFDD] flex flex-col justify-between" dir="ltr">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] shadow-md border-b border-[#B8860B]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 border border-[#B8860B]/40 flex items-center justify-center text-[#B8860B] shadow-inner">
              <Shield className="w-5 h-5 text-[#F1E7CE]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-base sm:text-lg text-[#F1E7CE] leading-tight">
                Quran Homework Portal
              </h1>
              <p className="text-[11px] text-[#B8860B] font-sans">
                Student Circles & Memorization Tracker
              </p>
            </div>
          </div>

          {/* Teacher Mode & Sync Controls */}
          <div className="flex items-center gap-2">
            {authState.role === 'teacher' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {onSyncToSupabase && (
                  <button
                    type="button"
                    onClick={() => setShowSyncConfirm(true)}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF6EE] text-[#0E5C56] hover:bg-[#F3EAD3] border border-[#B8860B]/40 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                    title="Sync all records to cloud"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E5C56]" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-[#B8860B]" />
                    )}
                    <span className="hidden sm:inline">
                      {isSyncing ? 'Syncing...' : 'Cloud Sync'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleTeacherMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isTeacherMode
                      ? 'bg-[#B8860B] text-white hover:bg-[#9B7008]'
                      : 'bg-white/15 text-[#F1E7CE] hover:bg-white/25'
                  }`}
                >
                  {isTeacherMode ? 'Teacher Mode (Active)' : 'Enable Teacher Mode'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Lock teacher mode and log out"
                  className="p-2 rounded-xl text-[#F1E7CE]/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="portal-teacher-login-btn"
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FBF6E8]/15 hover:bg-[#FBF6E8]/25 border border-[#F1E7CE]/40 text-[#F1E7CE] transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Teacher Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Cloud Sync Status Notification Toast */}
      {syncStatusMsg && (
        <div className="w-full bg-[#0E5C56] text-[#F1E7CE] px-4 py-2.5 text-center text-xs font-bold border-b border-[#B8860B]/40 animate-fade-in shadow-inner">
          {syncStatusMsg}
        </div>
      )}

      {/* Main Content Area: Dynamically ordered families */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col justify-center gap-5 sm:gap-7">
        {visibleFamilies.map((fam, famIndex) => {
          const famStudents = fam.studentIds
            .map((id) => students.find((s) => s.id === id))
            .filter((s): s is Student => Boolean(s));

          const isTwoStudentRow = famStudents.length === 2;

          return (
            <div key={fam.id} id={`portal-family-row-${fam.id}`} className="w-full space-y-2">
              {/* Teacher order/visibility controls & Parent password setup in teacher mode */}
              {isTeacherMode && onUpdateFamilyOrder && (
                <div className="flex items-center justify-between bg-black/5 px-3 py-1.5 rounded-xl text-xs text-[#5B6478]">
                  <span className="font-bold text-[#0E5C56]">
                    {fam.name} {fam.isHidden && '(Hidden from students)'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Set/Manage Parent Password Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFamilyForPasswordModal(fam);
                        setNewParentPassword('');
                        setPasswordSuccessMsg('');
                      }}
                      className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs ${
                        fam.parentPasswordHash
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-white text-[#5B6478] hover:bg-gray-100 border border-gray-300'
                      }`}
                      title={
                        fam.parentPasswordHash
                          ? 'Parent password set (Click to change/remove)'
                          : 'Set parent password for this family'
                      }
                    >
                      <KeyRound className="w-3 h-3 text-[#B8860B]" />
                      <span>{fam.parentPasswordHash ? 'Parent Pass ✓' : 'Set Parent Pass'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => moveFamily(fam.id, 'up')}
                      disabled={famIndex === 0}
                      className="p-1 hover:bg-black/10 rounded disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFamily(fam.id, 'down')}
                      disabled={famIndex === visibleFamilies.length - 1}
                      className="p-1 hover:bg-black/10 rounded disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHideFamily(fam.id)}
                      className="p-1 hover:bg-black/10 rounded cursor-pointer"
                      title={fam.isHidden ? 'Unhide family' : 'Hide family'}
                    >
                      {fam.isHidden ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {isTwoStudentRow ? (
                /* 2 Students centered */
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
                /* Grid of 3 Students */
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

      {/* Footer / Instructions */}
      <footer className="text-center py-4 text-xs text-[#5B6478] bg-transparent">
        Click any student to open their homework log and memorization schedule
      </footer>

      {/* Confirmation Modal for Cloud Sync */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-sans font-bold text-base text-[#0E5C56]">
              Upload Local Data to Cloud?
            </h3>
            <p className="text-xs text-[#5B6478] leading-relaxed">
              This will overwrite all cloud data with your current local families, students, and homework entries.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeManualSync}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0E5C56] text-white hover:bg-[#0B4D48] cursor-pointer shadow-xs"
              >
                Upload Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Teacher Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-sans font-bold text-base text-[#0E5C56]">
              Lock Teacher Access?
            </h3>
            <p className="text-xs text-[#5B6478] leading-relaxed">
              Are you sure you want to log out of teacher mode on this device?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher / Parent Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FAF6EE] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#B8860B]/30 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[#0E5C56] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B8860B]" />
                Teacher / Parent Login
              </h3>
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
              أدخل كلمة مرور المعلم للوصول الكامل، أو كلمة مرور ولي الأمر للوصول الخاص بعائلتك.
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
                  placeholder="Password..."
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0E5C56] hover:bg-[#0B4D48] text-white transition-colors cursor-pointer shadow-xs"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Parent Password Modal (Teacher-only) */}
      {familyForPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FAF6EE] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#B8860B]/30 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-[#0E5C56] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#B8860B]" />
                  Parent Password
                </h3>
                <p className="text-xs text-[#5B6478] font-bold mt-0.5">
                  {familyForPasswordModal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFamilyForPasswordModal(null);
                  setPasswordSuccessMsg('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5B6478] leading-relaxed">
              عيّن كلمة مرور خاصة بولي أمر هذه العائلة لتسمح له بتسجيل التقييمات ومتابعة أبنائه فقط.
            </p>

            <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200 text-xs">
              <span className="text-[#5B6478]">الحالة الحالية: </span>
              {familyForPasswordModal.parentPasswordHash ? (
                <span className="text-emerald-700 font-bold">كلمة المرور مفعّلة ✓</span>
              ) : (
                <span className="text-gray-500 italic">لا توجد كلمة مرور معينة</span>
              )}
            </div>

            {passwordSuccessMsg ? (
              <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>{passwordSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveParentPassword} className="space-y-3">
                <div>
                  <input
                    type="text"
                    autoFocus
                    value={newParentPassword}
                    onChange={(e) => setNewParentPassword(e.target.value)}
                    placeholder="Enter new parent password..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#B8860B]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E5C56] text-center font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {familyForPasswordModal.parentPasswordHash && (
                    <button
                      type="button"
                      onClick={handleRemoveParentPassword}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFamilyForPasswordModal(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0E5C56] hover:bg-[#0B4D48] text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
