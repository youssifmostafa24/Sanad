import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  Lock,
  Eye,
  Plus,
  Check,
  Star,
  MoreVertical,
  Send,
  Trash2,
  Edit2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Student, StudentTopNavTab, TeacherNote, FocusPoint } from '../types';
import {
  getTeacherNotesForStudent,
  setTeacherNotesForStudent,
  getMigratedFocusPoints,
  formatNoteDate,
  formatLastUpdatedDate,
} from '../utils/notesUtils';

interface StudentFocusNotesViewProps {
  student: Student | null;
  onSelectTab: (tab: StudentTopNavTab) => void;
  isTeacherMode: boolean;
  onSaveFocusPoints?: (studentId: string, focusPoints: FocusPoint[]) => void;
}

type NotesSegment = 'my_notes' | 'focus_points';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'pending';

export const StudentFocusNotesView: React.FC<StudentFocusNotesViewProps> = ({
  student,
  isTeacherMode,
  onSaveFocusPoints,
}) => {
  if (!student) return null;

  // Segment state (Teacher only) - remembers selection in sessionStorage
  const [segment, setSegment] = useState<NotesSegment>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sanad_notes_segment');
      if (saved === 'focus_points' || saved === 'my_notes') {
        return saved;
      }
    }
    return 'my_notes';
  });

  const handleSelectSegment = (seg: NotesSegment) => {
    setSegment(seg);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sanad_notes_segment', seg);
    }
  };

  // Private Teacher Notes state: NEVER populated or accessible when !isTeacherMode
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);

  // Shared Focus Points state (visible to student, parent, and teacher)
  const [focusPoints, setFocusPoints] = useState<FocusPoint[]>(() =>
    getMigratedFocusPoints(student)
  );

  // Load notes securely
  useEffect(() => {
    if (isTeacherMode) {
      setTeacherNotes(getTeacherNotesForStudent(student.id));
    } else {
      setTeacherNotes([]);
    }
    setFocusPoints(getMigratedFocusPoints(student));
  }, [student.id, isTeacherMode]);

  // Form input states
  const [newNoteText, setNewNoteText] = useState('');
  const [newPointText, setNewPointText] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);
  const pointInputRef = useRef<HTMLInputElement>(null);

  // Note inline editing & action row states
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState('');

  // Point inline editing state
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editingPointDraft, setEditingPointDraft] = useState('');

  // Status Chip & Undo
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [undoNoteSnapshot, setUndoNoteSnapshot] = useState<{
    note: TeacherNote;
    expiresAt: number;
  } | null>(null);
  const [undoPointSnapshot, setUndoPointSnapshot] = useState<{
    point: FocusPoint;
    expiresAt: number;
  } | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear Undo timers after 5 seconds
  useEffect(() => {
    if (!undoNoteSnapshot) return;
    const remaining = undoNoteSnapshot.expiresAt - Date.now();
    if (remaining <= 0) {
      setUndoNoteSnapshot(null);
      return;
    }
    const timer = setTimeout(() => setUndoNoteSnapshot(null), remaining);
    return () => clearTimeout(timer);
  }, [undoNoteSnapshot]);

  useEffect(() => {
    if (!undoPointSnapshot) return;
    const remaining = undoPointSnapshot.expiresAt - Date.now();
    if (remaining <= 0) {
      setUndoPointSnapshot(null);
      return;
    }
    const timer = setTimeout(() => setUndoPointSnapshot(null), remaining);
    return () => clearTimeout(timer);
  }, [undoPointSnapshot]);

  const triggerSavedFeedback = (customMsg?: string) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setSaveStatus(isOnline ? 'saved' : 'pending');
    setStatusMessage(customMsg || null);

    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
      setStatusMessage(null);
    }, 1500);
  };

  /* =========================================================================
      TEACHER NOTES ACTIONS (Teacher Mode Only)
     ========================================================================= */

  const persistTeacherNotes = (notes: TeacherNote[], customMsg?: string) => {
    if (!isTeacherMode) return;
    setTeacherNotes(notes);
    setTeacherNotesForStudent(student.id, notes);
    triggerSavedFeedback(customMsg);
  };

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newNoteText.trim();
    if (!text) return;

    const newNote: TeacherNote = {
      id: `tn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text,
      createdAt: new Date().toISOString(),
      pinned: false,
      done: false,
    };

    // Insert below pinned notes or at the top of unpinned
    const pinned = teacherNotes.filter((n) => n.pinned);
    const unpinned = teacherNotes.filter((n) => !n.pinned);
    const updated = [...pinned, newNote, ...unpinned];

    persistTeacherNotes(updated);
    setNewNoteText('');
    // Keep focus so notes can be typed quickly in class
    setTimeout(() => {
      noteInputRef.current?.focus();
    }, 10);
  };

  const handleToggleNoteDone = (noteId: string) => {
    const updated = teacherNotes.map((n) =>
      n.id === noteId ? { ...n, done: !n.done } : n
    );
    persistTeacherNotes(updated);
  };

  const handleToggleNotePin = (noteId: string) => {
    const updated = teacherNotes.map((n) =>
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    );
    persistTeacherNotes(updated);
    setExpandedNoteId(null);
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = teacherNotes.find((n) => n.id === noteId);
    if (!noteToDelete) return;

    setUndoNoteSnapshot({
      note: noteToDelete,
      expiresAt: Date.now() + 5000,
    });

    const updated = teacherNotes.filter((n) => n.id !== noteId);
    persistTeacherNotes(updated);
    setExpandedNoteId(null);
    setEditingNoteId(null);
  };

  const handleUndoDeleteNote = () => {
    if (!undoNoteSnapshot) return;
    const restored = [undoNoteSnapshot.note, ...teacherNotes];
    setUndoNoteSnapshot(null);
    persistTeacherNotes(restored);
  };

  const handleShareNoteToFocusPoints = (note: TeacherNote) => {
    // Copy note text into focusPoints as a new last point
    const newPoint: FocusPoint = {
      id: `fp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: note.text,
      order: focusPoints.length + 1,
      updatedAt: new Date().toISOString(),
    };
    const updatedPoints = [...focusPoints, newPoint];
    persistFocusPoints(updatedPoints, 'Added to Focus points');
    setExpandedNoteId(null);
  };

  const handleStartEditNote = (note: TeacherNote) => {
    setEditingNoteId(note.id);
    setEditingNoteDraft(note.text);
    setExpandedNoteId(null);
  };

  const handleSaveEditNote = (noteId: string) => {
    const trimmed = editingNoteDraft.trim();
    if (!trimmed) {
      handleDeleteNote(noteId);
      return;
    }
    const updated = teacherNotes.map((n) =>
      n.id === noteId ? { ...n, text: trimmed } : n
    );
    persistTeacherNotes(updated);
    setEditingNoteId(null);
  };

  /* =========================================================================
      FOCUS POINTS ACTIONS (Teacher Mode Only)
     ========================================================================= */

  const persistFocusPoints = (points: FocusPoint[], customMsg?: string) => {
    setFocusPoints(points);
    onSaveFocusPoints?.(student.id, points);
    triggerSavedFeedback(customMsg);
  };

  const handleAddPoint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newPointText.trim();
    if (!text) return;

    const newPoint: FocusPoint = {
      id: `fp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text,
      order: focusPoints.length + 1,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...focusPoints, newPoint];
    persistFocusPoints(updated);
    setNewPointText('');
    setTimeout(() => {
      pointInputRef.current?.focus();
    }, 10);
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= focusPoints.length) return;

    const reordered = [...focusPoints];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Renumber orders
    const updated = reordered.map((p, idx) => ({
      ...p,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    persistFocusPoints(updated);
  };

  const handleDeletePoint = (pointId: string) => {
    const pointToDelete = focusPoints.find((p) => p.id === pointId);
    if (!pointToDelete) return;

    setUndoPointSnapshot({
      point: pointToDelete,
      expiresAt: Date.now() + 5000,
    });

    const filtered = focusPoints.filter((p) => p.id !== pointId);
    const updated = filtered.map((p, idx) => ({
      ...p,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    persistFocusPoints(updated);
    setEditingPointId(null);
  };

  const handleUndoDeletePoint = () => {
    if (!undoPointSnapshot) return;
    const restored = [...focusPoints, undoPointSnapshot.point];
    restored.sort((a, b) => a.order - b.order);
    const updated = restored.map((p, idx) => ({ ...p, order: idx + 1 }));
    setUndoPointSnapshot(null);
    persistFocusPoints(updated);
  };

  const handleSaveEditPoint = (pointId: string) => {
    const trimmed = editingPointDraft.trim();
    if (!trimmed) {
      handleDeletePoint(pointId);
      return;
    }
    const updated = focusPoints.map((p) =>
      p.id === pointId
        ? { ...p, text: trimmed, updatedAt: new Date().toISOString() }
        : p
    );
    persistFocusPoints(updated);
    setEditingPointId(null);
  };

  // Sort notes: pinned first (newest first), then unpinned (newest first), then done (faded at bottom)
  const sortedTeacherNotes = [...teacherNotes].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="w-full pt-1 pb-4">
      {/* White Card container, radius 20px, padding 14px */}
      <div className="w-full bg-white rounded-[20px] p-3.5 sm:p-4 shadow-sm border border-[#E4DCC8] flex flex-col space-y-3.5 font-sans antialiased text-[#1F2A3D]">
        {/* =========================================================================
            HEADER ROW
           ========================================================================= */}
        <div className="flex items-center justify-between border-b border-[#F1EFE8] pb-3 shrink-0 select-none">
          {/* Left: Target icon in 40px light-green circle + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[#085041] shrink-0">
              <Target className="w-5 h-5 text-[#085041]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#085041] leading-tight">
                {isTeacherMode ? 'Notes' : 'Focus points'}
              </h3>
            </div>
          </div>

          {/* Right: Chips */}
          <div className="flex items-center gap-2">
            {/* Autosave Status / Undo Feedback Chip */}
            {isTeacherMode && (
              <div
                aria-live="polite"
                className="min-w-[96px] h-7 flex items-center justify-end"
              >
                {saveStatus === 'error' ? (
                  <div className="h-7 px-2.5 bg-[#FCEBEB] text-[#791F1F] rounded-full flex items-center gap-1 text-[12px] font-semibold border border-[#791F1F]/20">
                    <span>Not saved</span>
                  </div>
                ) : saveStatus === 'saving' ? (
                  <div className="h-7 px-2.5 bg-[#FAEEDA] text-[#633806] rounded-full flex items-center gap-1.5 text-[12px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#633806] animate-pulse" />
                    <span>Saving...</span>
                  </div>
                ) : saveStatus === 'pending' ? (
                  <div className="h-7 px-2.5 bg-[#FAEEDA] text-[#633806] rounded-full flex items-center gap-1 text-[12px] font-semibold">
                    <span>Will sync</span>
                  </div>
                ) : saveStatus === 'saved' || undoNoteSnapshot || undoPointSnapshot ? (
                  <div className="h-7 px-2.5 bg-[#E1F5EE] text-[#085041] rounded-full flex items-center gap-1 text-[13px] font-medium transition-all shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#085041] shrink-0" />
                    <span>{statusMessage || 'Saved'}</span>
                    {(undoNoteSnapshot || undoPointSnapshot) && (
                      <button
                        type="button"
                        onClick={undoNoteSnapshot ? handleUndoDeleteNote : handleUndoDeletePoint}
                        className="underline text-[12px] font-bold ml-1 text-[#085041] hover:text-[#063d31] cursor-pointer"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Audience / Updated info chip */}
            {isTeacherMode ? (
              segment === 'my_notes' ? (
                <div className="h-7 bg-[#FAEEDA] text-[#633806] px-2.5 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-[#633806]" />
                  <span>Only me</span>
                </div>
              ) : (
                <div className="h-7 bg-[#E1F5EE] text-[#085041] px-2.5 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0">
                  <Eye className="w-3.5 h-3.5 text-[#085041]" />
                  <span>Student & parent</span>
                </div>
              )
            ) : (
              <span className="text-xs text-gray-500 font-medium">
                {formatLastUpdatedDate(focusPoints)}
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            TEACHER MODE: SEGMENTED CONTROL (40px high, active solid green #0F6E56)
           ========================================================================= */}
        {isTeacherMode && (
          <div className="w-full h-10 bg-[#F4EFE6] rounded-xl p-1 flex items-center gap-1 select-none">
            <button
              type="button"
              onClick={() => handleSelectSegment('my_notes')}
              className={`flex-1 h-full rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                segment === 'my_notes'
                  ? 'bg-[#0F6E56] text-white shadow-xs'
                  : 'text-[#5B6478] hover:text-[#1F2A3D]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>My notes</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSegment('focus_points')}
              className={`flex-1 h-full rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                segment === 'focus_points'
                  ? 'bg-[#0F6E56] text-white shadow-xs'
                  : 'text-[#5B6478] hover:text-[#1F2A3D]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Focus points</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: MY NOTES (Teacher Mode Only)
           ========================================================================= */}
        {isTeacherMode && segment === 'my_notes' && (
          <div className="flex flex-col space-y-3">
            {/* Quick-add field at top (48px, 1.5px green border, radius 14px) */}
            <form
              onSubmit={handleAddNote}
              className="w-full h-12 border-[1.5px] border-[#0F6E56] rounded-[14px] bg-white px-3 flex items-center gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-[#0F6E56]/20 transition-all"
            >
              <Plus className="w-5 h-5 text-[#0F6E56] shrink-0" />
              <input
                ref={noteInputRef}
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add a note"
                className="flex-1 bg-transparent text-sm sm:text-[15px] font-medium text-[#1F2A27] placeholder-gray-400 focus:outline-none"
                dir="auto"
              />
              <button
                type="submit"
                aria-label="Add note"
                className="w-9 h-9 rounded-xl bg-[#0F6E56] hover:bg-[#0B4A45] text-white flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Note list */}
            {sortedTeacherNotes.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#8a8a80]">
                No notes yet
              </div>
            ) : (
              <div className="divide-y divide-[#F1EFE8]">
                {sortedTeacherNotes.map((note) => {
                  const isPinned = note.pinned;
                  const isDone = note.done;
                  const isExpanded = expandedNoteId === note.id;
                  const isEditing = editingNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`min-h-[52px] rounded-xl py-2 px-2 flex flex-col gap-1.5 transition-colors ${
                        isPinned ? 'bg-[#FAEEDA]/70' : 'hover:bg-slate-50/70'
                      } ${isDone ? 'opacity-55' : ''}`}
                    >
                      <div className="flex items-start gap-2.5 w-full">
                        {/* Pinned star OR Circular checkbox */}
                        <div className="pt-0.5 shrink-0">
                          {isPinned ? (
                            <button
                              type="button"
                              onClick={() => handleToggleNotePin(note.id)}
                              className="w-6 h-6 flex items-center justify-center cursor-pointer"
                              title="Unpin note"
                            >
                              <Star className="w-5 h-5 text-[#B8860B] fill-[#B8860B]" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleNoteDone(note.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                isDone
                                  ? 'bg-[#0F6E56] border-[#0F6E56] text-white'
                                  : 'border-[#D3CDBB] bg-white hover:border-[#0F6E56]'
                              }`}
                              title={isDone ? 'Mark as active' : 'Mark as done'}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          )}
                        </div>

                        {/* Note text & date */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5">
                              <textarea
                                value={editingNoteDraft}
                                onChange={(e) => setEditingNoteDraft(e.target.value)}
                                onBlur={() => handleSaveEditNote(note.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEditNote(note.id);
                                  }
                                }}
                                autoFocus
                                rows={2}
                                className="w-full p-2 bg-white border border-[#0F6E56] rounded-lg text-[16px] text-[#1F2A27] focus:outline-none"
                                dir="auto"
                              />
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditNote(note.id)}
                                  className="px-2.5 py-1 bg-[#0F6E56] text-white text-xs font-bold rounded-md"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartEditNote(note)}
                              className="cursor-pointer group/text"
                            >
                              <p
                                className={`text-[17px] text-[#1F2A27] leading-snug break-words ${
                                  isDone ? 'line-through text-gray-500' : ''
                                }`}
                                dir="auto"
                              >
                                {note.text}
                              </p>
                              <span className="text-[11px] text-[#8a8a80] font-medium block mt-0.5">
                                {formatNoteDate(note.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Three dots button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNoteId(isExpanded ? null : note.id)
                          }
                          aria-label="Actions"
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 cursor-pointer shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inline Action Row under note (Pin, Share, Delete) */}
                      {isExpanded && (
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#F1EFE8]/70">
                          {/* Pin / Unpin */}
                          <button
                            type="button"
                            onClick={() => handleToggleNotePin(note.id)}
                            className="h-10 px-3 min-w-[40px] rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-[#1F2A27] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isPinned ? 'text-[#B8860B] fill-[#B8860B]' : 'text-gray-500'
                              }`}
                            />
                            <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                          </button>

                          {/* Share to Focus points */}
                          <button
                            type="button"
                            onClick={() => handleShareNoteToFocusPoints(note)}
                            className="h-10 px-3 min-w-[40px] rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-[#0F6E56] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            title="Copy to Focus points"
                          >
                            <Send className="w-4 h-4" />
                            <span>Share</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-10 px-3 min-w-[40px] rounded-lg bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-600 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 2: FOCUS POINTS (Shared: Teacher editable, Student/Parent read-only)
           ========================================================================= */}
        {(!isTeacherMode || segment === 'focus_points') && (
          <div className="flex flex-col space-y-3">
            {/* Points list */}
            {focusPoints.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#8a8a80]">
                No focus points yet
              </div>
            ) : (
              <div className="divide-y divide-[#F1EFE8]">
                {focusPoints.map((point, index) => {
                  const isEditing = isTeacherMode && editingPointId === point.id;

                  return (
                    <div
                      key={point.id}
                      className={`flex items-start gap-3 transition-colors ${
                        isTeacherMode ? 'py-2.5' : 'py-3.5'
                      }`}
                    >
                      {/* Number circle (26px, #E1F5EE, text #085041) */}
                      <div className="w-[26px] h-[26px] rounded-full bg-[#E1F5EE] text-[#085041] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              value={editingPointDraft}
                              onChange={(e) => setEditingPointDraft(e.target.value)}
                              onBlur={() => handleSaveEditPoint(point.id)}
                              autoFocus
                              rows={2}
                              className="w-full p-2 bg-white border border-[#0F6E56] rounded-lg text-[16px] text-[#1F2A27] focus:outline-none"
                              dir="auto"
                            />
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleDeletePoint(point.id)}
                                className="text-xs font-semibold text-red-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditPoint(point.id)}
                                className="px-2.5 py-1 bg-[#0F6E56] text-white text-xs font-bold rounded-md"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-[17px] text-[#1F2A27] leading-relaxed break-words"
                            dir="auto"
                          >
                            {point.text}
                          </p>
                        )}
                      </div>

                      {/* Teacher tools: Pencil & Reorder handles */}
                      {isTeacherMode && !isEditing && (
                        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                          {/* Pencil button (36px) */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPointId(point.id);
                              setEditingPointDraft(point.text);
                            }}
                            aria-label="Edit point"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMovePoint(index, 'up')}
                            aria-label="Move point up"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={index === focusPoints.length - 1}
                            onClick={() => handleMovePoint(index, 'down')}
                            aria-label="Move point down"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Grip Handle indicator */}
                          <div
                            className="w-5 h-9 flex items-center justify-center text-gray-300"
                            aria-hidden="true"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick-add field at bottom (Teacher Mode Only) */}
            {isTeacherMode && (
              <form
                onSubmit={handleAddPoint}
                className="w-full h-12 border-[1.5px] border-[#0F6E56] rounded-[14px] bg-white px-3 flex items-center gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-[#0F6E56]/20 transition-all mt-2"
              >
                <Plus className="w-5 h-5 text-[#0F6E56] shrink-0" />
                <input
                  ref={pointInputRef}
                  type="text"
                  value={newPointText}
                  onChange={(e) => setNewPointText(e.target.value)}
                  placeholder="Add a point"
                  className="flex-1 bg-transparent text-sm sm:text-[15px] font-medium text-[#1F2A27] placeholder-gray-400 focus:outline-none"
                  dir="auto"
                />
                <button
                  type="submit"
                  aria-label="Add point"
                  className="w-9 h-9 rounded-xl bg-[#0F6E56] hover:bg-[#0B4A45] text-white flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
