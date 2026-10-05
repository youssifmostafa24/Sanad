import React, { useState, useEffect } from 'react';
import { AuthState, Family, Student } from '../types';
import {
  Shield,
  KeyRound,
  CloudUpload,
  Loader2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  Settings,
  ShieldOff,
  ArrowLeft,
  Pencil,
  Plus,
  ChevronRight,
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
  onAddFamily?: (name: string) => void;
  onAddStudent?: (familyId: string, name: string) => void;
}

export const MainPortal: React.FC<MainPortalProps> = ({
  families,
  students,
  onSelectFamilyAndStudent,
  authState,
  onLoginSuccess,
  onLogout,
  isTeacherMode,
  onOpenStudentSettings,
  onSyncToSupabase,
  onUpdateFamilyOrder,
  onUpdateFamilyParentPassword,
  onAddFamily,
  onAddStudent,
}) => {
  // Navigation: Settings page vs Home view
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  // Teacher / Parent Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cloud sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // Parent Password Settings Modal
  const [familyForPasswordModal, setFamilyForPasswordModal] = useState<Family | null>(null);
  const [newParentPassword, setNewParentPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // Inline forms in Settings page
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [addingStudentFamilyId, setAddingStudentFamilyId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');

  // If teacher mode is turned off, settings page cannot remain open
  useEffect(() => {
    if (!isTeacherMode && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [isTeacherMode, isSettingsOpen]);

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
        <Shield className="w-12 h-12 text-[#1F5A4E] mb-3 animate-pulse" />
        <h2 className="text-lg font-bold text-[#1F5A4E]">Redirecting to Family View...</h2>
        <p className="text-xs text-[#5E6B66] mt-1">Parent account linked to family: {myFam?.name || ''}</p>
        <button
          type="button"
          onClick={() => {
            if (myFam && myFam.studentIds[0]) onSelectFamilyAndStudent(myFam.id, myFam.studentIds[0]);
          }}
          className="mt-4 px-5 py-2 bg-[#1F5A4E] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/30"
        >
          Open Family
        </button>
      </div>
    );
  }

  const handleGearClick = () => {
    if (isTeacherMode) {
      setIsSettingsOpen(true);
    } else {
      setShowLoginModal(true);
      setPasswordInput('');
      setErrorMsg('');
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
      if (resolvedAuth.role === 'teacher') {
        setIsSettingsOpen(true);
      }
    } else {
      setErrorMsg('Incorrect password');
    }
  };

  const handleExitTeacherMode = () => {
    onLogout();
    setIsSettingsOpen(false);
  };

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

  const handleSaveParentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyForPasswordModal || !onUpdateFamilyParentPassword) return;

    if (!newParentPassword.trim()) {
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

  // Sort families dynamically by displayOrder
  const sortedFamilies = [...families].sort((a, b) => {
    const orderA = a.displayOrder !== undefined ? a.displayOrder : 999;
    const orderB = b.displayOrder !== undefined ? b.displayOrder : 999;
    return orderA - orderB;
  });

  // Visible families on Home Page (hidden families visible=false are NOT shown)
  const visibleFamilies = sortedFamilies.filter((f) => !f.isHidden);

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

  return (
    <div id="main-portal-view" className="min-h-screen bg-[#F5EFDD] flex flex-col justify-between" dir="ltr">
      {/* Toast Notification */}
      {syncStatusMsg && (
        <div className="w-full bg-[#1F5A4E] text-[#F1E7CE] px-4 py-2 text-center text-xs font-medium border-b border-[#FAC775]/40 animate-fade-in shadow-inner">
          {syncStatusMsg}
        </div>
      )}

      {isSettingsOpen ? (
        /* ==================== SETTINGS PAGE ==================== */
        <div className="flex-1 flex flex-col">
          {/* Settings Header bar */}
          <header className="sticky top-0 z-40 bg-[#1F5A4E] text-white shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
              <button
                type="button"
                aria-label="Back"
                onClick={() => setIsSettingsOpen(false)}
                className="w-[44px] h-[44px] -ml-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FAC775]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-[17px] font-medium text-white leading-none tracking-tight">
                Settings
              </h1>
            </div>
          </header>

          {/* Settings Main Content */}
          <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 flex flex-col gap-4">
            {/* 1. First item: "Exit teacher mode" row */}
            <button
              type="button"
              onClick={handleExitTeacherMode}
              className="w-full min-h-[48px] px-4 py-3 bg-[#FAEEDA] border border-[#FAC775] text-[#633806] rounded-[14px] flex items-center gap-3 font-medium text-sm hover:bg-[#F5E2C4] active:scale-[0.99] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#633806]/40"
            >
              <ShieldOff className="w-5 h-5 text-[#633806] shrink-0" />
              <span className="flex-1 text-left">Exit teacher mode</span>
            </button>

            {/* 2. Section label "Families", then one card per family */}
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-medium text-[#5E6B66] px-1">
                Families
              </div>

              {sortedFamilies.map((fam, famIndex) => {
                const famStudents = fam.studentIds
                  .map((id) => students.find((s) => s.id === id))
                  .filter((s): s is Student => Boolean(s));

                const isExpanded = expandedFamilyId === fam.id;

                return (
                  <div
                    key={fam.id}
                    className={`bg-white border rounded-[14px] overflow-hidden transition-all shadow-2xs ${
                      fam.isHidden
                        ? 'bg-gray-100/70 border-gray-200'
                        : 'border-[#E4DCC8]'
                    }`}
                  >
                    {/* Family Header */}
                    <div
                      onClick={() => setExpandedFamilyId(isExpanded ? null : fam.id)}
                      className="min-h-[48px] px-4 py-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <span
                        className={`text-[14px] font-medium truncate flex-1 ${
                          fam.isHidden ? 'text-gray-400 italic' : 'text-[#1F5A4E]'
                        }`}
                      >
                        {fam.name} {fam.isHidden && '(Hidden)'}
                      </span>

                      {/* Three 40px icon buttons: move up, move down, show/hide */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveFamily(fam.id, 'up')}
                          disabled={famIndex === 0}
                          aria-label="Move family up"
                          title="Move up"
                          className="w-[40px] h-[40px] rounded-lg flex items-center justify-center hover:bg-black/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-[#1F5A4E] focus:outline-none focus:ring-1 focus:ring-[#1F5A4E]/30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFamily(fam.id, 'down')}
                          disabled={famIndex === sortedFamilies.length - 1}
                          aria-label="Move family down"
                          title="Move down"
                          className="w-[40px] h-[40px] rounded-lg flex items-center justify-center hover:bg-black/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-[#1F5A4E] focus:outline-none focus:ring-1 focus:ring-[#1F5A4E]/30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleHideFamily(fam.id)}
                          aria-label={fam.isHidden ? 'Show family' : 'Hide family'}
                          title={fam.isHidden ? 'Show family' : 'Hide family'}
                          className="w-[40px] h-[40px] rounded-lg flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all text-[#1F5A4E] focus:outline-none focus:ring-1 focus:ring-[#1F5A4E]/30 cursor-pointer"
                        >
                          {fam.isHidden ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-[#1F5A4E]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline expanded panel into soft green panel */}
                    {isExpanded && (
                      <div className="bg-[#F1FAF6] border-2 border-[#9FE1CB] rounded-xl p-3.5 mx-3 mb-3 space-y-3">
                        {/* Parent pass row */}
                        <div className="min-h-[48px] flex items-center justify-between bg-white px-3.5 py-2 rounded-lg border border-[#9FE1CB]/60">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#1F5A4E]">
                            <KeyRound className="w-4 h-4 text-[#1F5A4E]" />
                            <span>Parent pass</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFamilyForPasswordModal(fam);
                              setNewParentPassword('');
                              setPasswordSuccessMsg('');
                            }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1F5A4E] hover:bg-[#16433a] text-white cursor-pointer transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/30"
                          >
                            {fam.parentPasswordHash ? 'Change' : 'Set'}
                          </button>
                        </div>

                        {/* Students chips & + Student chip */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-[#5E6B66] uppercase tracking-wider block">
                            Students
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {famStudents.map((st) => (
                              <div
                                key={st.id}
                                className="inline-flex items-center gap-2 bg-white border border-[#9FE1CB] rounded-full pl-1 pr-2.5 py-1 shadow-2xs min-h-[38px]"
                              >
                                <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                                  {st.photoUrl ? (
                                    <img
                                      src={st.photoUrl}
                                      alt={st.name}
                                      style={{
                                        objectPosition: st.photoPosition || '50% 20%',
                                        transform: `scale(${st.photoZoom || 1.0})`,
                                      }}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-xs text-white"
                                      style={{ backgroundColor: st.color }}
                                    >
                                      {st.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-medium text-[#1F5A4E]">
                                  {st.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onOpenStudentSettings?.(st)}
                                  className="p-1 text-[#5E6B66] hover:text-[#1F5A4E] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                                  aria-label={`Edit ${st.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            {/* Dashed + Student chip */}
                            <button
                              type="button"
                              onClick={() => {
                                setAddingStudentFamilyId(fam.id);
                                setNewStudentName('');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[#1F5A4E]/50 hover:border-[#1F5A4E] bg-white/70 hover:bg-white text-xs font-medium text-[#1F5A4E] cursor-pointer transition-colors min-h-[38px] active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#1F5A4E]/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Student</span>
                            </button>
                          </div>

                          {/* Inline form to add student to this family */}
                          {addingStudentFamilyId === fam.id && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (newStudentName.trim()) {
                                  onAddStudent?.(fam.id, newStudentName.trim());
                                  setAddingStudentFamilyId(null);
                                  setNewStudentName('');
                                }
                              }}
                              className="flex items-center gap-2 pt-2 w-full max-w-sm"
                            >
                              <input
                                type="text"
                                autoFocus
                                placeholder="Student English name..."
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#9FE1CB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]"
                              />
                              <button
                                type="submit"
                                disabled={!newStudentName.trim()}
                                className="px-3 py-1.5 bg-[#1F5A4E] text-white text-xs font-medium rounded-lg hover:bg-[#16433a] disabled:opacity-50 cursor-pointer"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingStudentFamilyId(null);
                                  setNewStudentName('');
                                }}
                                className="px-2 py-1.5 text-xs text-[#5E6B66] hover:text-black cursor-pointer"
                              >
                                Cancel
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. Dashed full-width "Add family" button */}
            {isAddingFamily ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newFamilyName.trim()) {
                    onAddFamily?.(newFamilyName.trim());
                    setIsAddingFamily(false);
                    setNewFamilyName('');
                  }
                }}
                className="w-full bg-white p-3.5 rounded-[14px] border-2 border-dashed border-[#9FE1CB] space-y-2 shadow-2xs"
              >
                <label className="block text-xs font-medium text-[#1F5A4E]">Add New Family</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Family name (e.g. Sulayman + Ibrahim)..."
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#F1FAF6] border border-[#9FE1CB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]"
                  />
                  <button
                    type="submit"
                    disabled={!newFamilyName.trim()}
                    className="px-3.5 py-2 bg-[#1F5A4E] text-white text-xs font-bold rounded-xl hover:bg-[#16433a] disabled:opacity-50 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFamily(false);
                      setNewFamilyName('');
                    }}
                    className="px-2.5 py-2 text-xs text-[#5E6B66] hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingFamily(true)}
                className="w-full min-h-[48px] border-2 border-dashed border-[#9FE1CB] hover:border-[#1F5A4E] bg-white/50 hover:bg-[#F1FAF6] rounded-[14px] text-sm font-medium text-[#1F5A4E] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add family</span>
              </button>
            )}

            {/* 4. Final row "Upload to cloud" */}
            <button
              type="button"
              onClick={() => setShowSyncConfirm(true)}
              disabled={isSyncing}
              className="w-full min-h-[48px] px-4 py-3 bg-white border border-[#E4DCC8] rounded-[14px] flex items-center justify-between text-sm font-medium text-[#1F5A4E] hover:bg-gray-50 active:scale-[0.99] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/30 disabled:opacity-60 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                {isSyncing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#1F5A4E]" />
                ) : (
                  <CloudUpload className="w-5 h-5 text-[#1F5A4E]" />
                )}
                <span>{isSyncing ? 'Syncing to cloud...' : 'Upload to cloud'}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5E6B66]" />
            </button>
          </main>
        </div>
      ) : (
        /* ==================== HOME PAGE ==================== */
        <div className="flex-1 flex flex-col">
          {/* Header bar (dark green #1F5A4E): small shield icon circle + title "Quran Homework Portal" on the left (single line, 17px, weight 500).
              On the right put ONE 44px round icon button: a settings (gear) icon, aria-label "Settings". */}
          <header className="sticky top-0 z-40 bg-[#1F5A4E] text-[#F1E7CE] shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <h1 className="text-[17px] font-medium text-white leading-none tracking-tight whitespace-nowrap">
                  Quran Homework Portal
                </h1>
              </div>

              {/* Settings (gear) button */}
              <button
                type="button"
                aria-label="Settings"
                onClick={handleGearClick}
                className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FAC775]"
              >
                <Settings className="w-5 h-5" />
                {isTeacherMode && (
                  <span
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FAC775] ring-1 ring-[#1F5A4E]"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </header>

          {/* Family sections */}
          <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 flex flex-col justify-start">
            <div className="flex flex-col gap-[18px] w-full">
              {visibleFamilies.map((fam) => {
                const famStudents = fam.studentIds
                  .map((id) => students.find((s) => s.id === id))
                  .filter((s): s is Student => Boolean(s));

                const namesLabel = famStudents.map((s) => s.name).join(' · ');

                return (
                  <div key={fam.id} id={`portal-family-${fam.id}`} className="w-full">
                    {/* Plain text label (13px, weight 500, #5E6B66) with students' names joined by " · " */}
                    <div className="text-[13px] font-medium text-[#5E6B66] leading-none mb-2 px-0.5">
                      {namesLabel || fam.name}
                    </div>

                    {/* 3-column grid (gap 10px) of student cards, left-aligned even when 1-2 students */}
                    <div className="grid grid-cols-3 gap-[10px] w-full">
                      {famStudents.map((st) => (
                        <div
                          key={st.id}
                          id={`portal-student-${st.id}`}
                          onClick={() => onSelectFamilyAndStudent(fam.id, st.id)}
                          className="bg-white border border-[#E4DCC8] rounded-[18px] pt-[14px] px-[6px] pb-[12px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 hover:shadow-xs hover:border-[#1F5A4E]/40 active:scale-98 select-none focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/30"
                        >
                          {/* Avatar circle 56px */}
                          <div className="w-[56px] h-[56px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                            {st.photoUrl ? (
                              <img
                                src={st.photoUrl}
                                alt={st.name}
                                style={{
                                  objectPosition: st.photoPosition || '50% 20%',
                                  transform: `scale(${st.photoZoom || 1.0})`,
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-[56px] h-[56px] rounded-full flex items-center justify-center font-bold text-xl text-white shadow-inner"
                                style={{ backgroundColor: st.color }}
                              >
                                {st.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Student's ENGLISH name only */}
                          <span className="text-[15px] font-medium text-[#1F5A4E] leading-tight truncate max-w-full mt-2.5 px-1">
                            {st.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Footer instruction */}
          <footer className="text-center py-4 text-xs text-[#5E6B66] bg-transparent">
            Click any student to open their homework log and memorization schedule
          </footer>
        </div>
      )}

      {/* Confirmation Modal for Cloud Sync */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-sans font-bold text-base text-[#1F5A4E]">
              Upload Local Data to Cloud?
            </h3>
            <p className="text-xs text-[#5E6B66] leading-relaxed">
              This will overwrite all cloud data with your current local families, students, and homework entries.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5E6B66] hover:bg-black/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeManualSync}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F5A4E] text-white hover:bg-[#16433a] cursor-pointer shadow-xs"
              >
                Upload Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher / Parent Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FAF6EE] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#FAC775]/40 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[#1F5A4E] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#1F5A4E]" />
                Teacher / Parent Login
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setErrorMsg('');
                  setPasswordInput('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5E6B66] leading-relaxed">
              Enter teacher password for full access, or parent password for family access.
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
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E4DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F5A4E] text-center tracking-widest font-mono"
                />
                {errorMsg && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium text-center">
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
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#5E6B66] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1F5A4E] hover:bg-[#16433a] text-white transition-colors cursor-pointer shadow-xs"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Parent Password Modal */}
      {familyForPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FAF6EE] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#FAC775]/40 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-[#1F5A4E] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#1F5A4E]" />
                  Parent Password
                </h3>
                <p className="text-xs text-[#5E6B66] font-bold mt-0.5">
                  {familyForPasswordModal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFamilyForPasswordModal(null);
                  setPasswordSuccessMsg('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5E6B66] leading-relaxed">
              Set a password for this family's parents to allow them to view and manage their children's homework records.
            </p>

            <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200 text-xs">
              <span className="text-[#5E6B66]">Current status: </span>
              {familyForPasswordModal.parentPasswordHash ? (
                <span className="text-emerald-700 font-bold">Password set ✓</span>
              ) : (
                <span className="text-gray-500 italic">No password set</span>
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
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E4DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F5A4E] text-center font-mono"
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
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#5E6B66] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1F5A4E] hover:bg-[#16433a] text-white transition-colors cursor-pointer shadow-xs"
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
