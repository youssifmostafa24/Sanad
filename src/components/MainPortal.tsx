import React, { useState } from 'react';
import { Family, Student } from '../types';
import {
  Check,
  Shield,
  KeyRound,
  Lock,
  Camera,
  CloudUpload,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
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
  onUpdateFamilyOrder?: (updatedFamilies: Family[]) => void;
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
  onUpdateFamilyOrder,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Confirmations
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyTeacherPassword(passwordInput)) {
      setShowLoginModal(false);
      setPasswordInput('');
      setErrorMsg('');
      onTeacherLoginSuccess();
    } else {
      setErrorMsg('Incorrect password');
    }
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
    const updated = families.map((f) =>
      f.id === famId ? { ...f, isHidden: !f.isHidden } : f
    );
    onUpdateFamilyOrder(updated);
  };

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
              <span className="text-xs sm:text-sm text-white/95 font-sans font-bold mt-2">
                {student.name}
              </span>
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
              title="Edit photo & settings"
              className="absolute top-2 left-2 z-10 p-2 rounded-full bg-black/60 hover:bg-[#B8860B] text-white shadow-md backdrop-blur-xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Subtle Corner Badge for Tilawa Bookmarking */}
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
            {isTeacherAuthenticated ? (
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
              {/* Teacher order/visibility controls in teacher mode */}
              {isTeacherMode && onUpdateFamilyOrder && (
                <div className="flex items-center justify-between bg-black/5 px-3 py-1 rounded-xl text-xs text-[#5B6478]">
                  <span className="font-bold text-[#0E5C56]">
                    {fam.name} {fam.isHidden && '(Hidden from students)'}
                  </span>
                  <div className="flex items-center gap-1">
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

      {/* Footer */}
      <footer className="py-3 border-t border-[#B8860B]/20 bg-[#FBF6E8]/60 text-center text-xs text-[#5B6478]">
        Quran Homework Tracker · Daily Memorization & Recitation
      </footer>

      {/* Confirm Teacher Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] text-[#1F2A3D] border border-[#B8860B]/40 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#0E5C56]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5 text-[#B8860B]" />
              </div>
              <h3 className="text-base font-bold font-sans">Lock Teacher Mode</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
              Are you sure you want to lock teacher mode and log out? You will need your password to re-enter.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onTeacherLogout();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Manual Cloud Sync Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] text-[#1F2A3D] border border-[#B8860B]/40 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#0E5C56]">
              <div className="w-9 h-9 rounded-xl bg-[#0E5C56]/15 border border-[#0E5C56]/30 flex items-center justify-center text-[#0E5C56]">
                <CloudUpload className="w-5 h-5 text-[#0E5C56]" />
              </div>
              <h3 className="text-base font-bold font-sans">Save Data to Cloud</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
              This will upload and sync all homework records, grades, and settings to the Supabase cloud database. Continue?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeManualSync}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#0E5C56] hover:bg-[#0A423E] text-white transition-colors cursor-pointer shadow-xs"
              >
                Confirm Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] text-[#1F2A3D] border border-[#B8860B]/40 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#B8860B]" />
                </div>
                <h3 className="text-base font-bold text-[#0E5C56] font-sans">
                  Teacher Login
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
              Enter your password to unlock teacher privileges.
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
    </div>
  );
};
