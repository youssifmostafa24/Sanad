import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Check,
  X,
  Edit3,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  QURAN_SURAHS,
  QuranSurah,
  formatQuranHomework,
  parseQuranHomework,
  getSurahFromHomework,
  SURAH_STATUS_OPTIONS,
  getSurahStatusMeta,
  normalizeArabicName,
} from '../data/quranSurahs';
import { SurahMemorizationStatus, GradeValue } from '../types';
import { GradeBadge } from './GradeBadge';

interface InlineHomeworkEditorProps {
  taskTitle: string;
  initialText: string;
  grade?: GradeValue | null;
  onUpdateGrade?: (grade: GradeValue | null) => void;
  onSave: (formattedText: string) => void;
  onClose: () => void;
  studentSurahRatings?: Record<number, SurahMemorizationStatus>;
  onUpdateSurahStatus?: (surahNumber: number, status: SurahMemorizationStatus) => void;
  isTeacherMode?: boolean;
}

interface HistorySnapshot {
  isFreeWriting: boolean;
  freeText: string;
  selectedSurahNumber: number;
  fromAyah: number;
  toAyah: number;
  formattedText: string;
  surahStatus?: { surahNumber: number; status: SurahMemorizationStatus };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'pending';

export const InlineHomeworkEditor: React.FC<InlineHomeworkEditorProps> = ({
  taskTitle,
  initialText,
  grade,
  onUpdateGrade,
  onSave,
  onClose,
  studentSurahRatings,
  onUpdateSurahStatus,
  isTeacherMode = false,
}) => {
  const [isFreeWriting, setIsFreeWriting] = useState<boolean>(false);
  const [freeText, setFreeText] = useState<string>('');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(56);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(16);

  // Dropdown state: only one open at a time
  const [openDropdown, setOpenDropdown] = useState<'surah' | 'status' | 'from' | 'to' | null>(null);
  const [surahSearch, setSurahSearch] = useState<string>('');

  // Autosave and Undo states
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [undoSnapshot, setUndoSnapshot] = useState<HistorySnapshot | null>(null);
  const [undoExpiresAt, setUndoExpiresAt] = useState<number>(0);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  const lastPersistedTextRef = useRef<string>(initialText);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for dialog & triggers
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const surahTriggerRef = useRef<HTMLButtonElement>(null);
  const statusTriggerRef = useRef<HTMLButtonElement>(null);
  const fromTriggerRef = useRef<HTMLButtonElement>(null);
  const toTriggerRef = useRef<HTMLButtonElement>(null);

  // Refs for dropdown scrolling
  const surahListRef = useRef<HTMLDivElement>(null);
  const currentSurahItemRef = useRef<HTMLButtonElement>(null);
  const fromListRef = useRef<HTMLDivElement>(null);
  const currentFromItemRef = useRef<HTMLButtonElement>(null);
  const toListRef = useRef<HTMLDivElement>(null);
  const currentToItemRef = useRef<HTMLButtonElement>(null);

  // Coordinates for anchored dropdown
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  const currentSurah: QuranSurah =
    QURAN_SURAHS.find((s) => s.number === selectedSurahNumber) || QURAN_SURAHS[55]; // default Al-Waqiah (56)

  // Active surah number for status
  const detectedSurah = isFreeWriting ? getSurahFromHomework(freeText) : null;
  const activeSurahNumber = isFreeWriting
    ? (detectedSurah?.number || selectedSurahNumber)
    : selectedSurahNumber;

  const currentStatus: SurahMemorizationStatus =
    studentSurahRatings?.[activeSurahNumber] || 'not_memorized';
  const currentStatusMeta = getSurahStatusMeta(currentStatus);

  // Parse existing text on mount
  useEffect(() => {
    lastPersistedTextRef.current = initialText;
    const parsed = parseQuranHomework(initialText);
    if (parsed) {
      const validSurahNum = Math.max(1, Math.min(114, parsed.surahNumber));
      setSelectedSurahNumber(validSurahNum);
      setFromAyah(parsed.fromAyah);
      setToAyah(parsed.toAyah);
      setFreeText(initialText);
      setIsFreeWriting(false);
    } else if (initialText && initialText.trim()) {
      setFreeText(initialText);
      setIsFreeWriting(true);
    } else {
      setSelectedSurahNumber(56);
      setFromAyah(1);
      setToAyah(16);
      setFreeText('');
      setIsFreeWriting(false);
    }
  }, [initialText]);

  // Lock body scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Timer to clear undo snapshot after 5 seconds
  useEffect(() => {
    if (!undoSnapshot || !undoExpiresAt) return;
    const remaining = undoExpiresAt - Date.now();
    if (remaining <= 0) {
      setUndoSnapshot(null);
      return;
    }
    const timer = setTimeout(() => {
      setUndoSnapshot(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [undoSnapshot, undoExpiresAt]);

  // Helper to revert UI if write fails
  const revertToSnapshot = (snap: HistorySnapshot) => {
    setIsFreeWriting(snap.isFreeWriting);
    setFreeText(snap.freeText);
    setSelectedSurahNumber(snap.selectedSurahNumber);
    setFromAyah(snap.fromAyah);
    setToAyah(snap.toAyah);
    if (snap.surahStatus) {
      onUpdateSurahStatus?.(snap.surahStatus.surahNumber, snap.surahStatus.status);
    }
  };

  // Perform atomic write and update status chip
  const performWrite = (textToSave: string, previousStateSnapshot?: HistorySnapshot) => {
    if (textToSave === lastPersistedTextRef.current) {
      return;
    }

    if (previousStateSnapshot) {
      setUndoSnapshot(previousStateSnapshot);
      setUndoExpiresAt(Date.now() + 5000);
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setSaveStatus(isOnline ? 'saving' : 'pending');

    try {
      onSave(textToSave);
      lastPersistedTextRef.current = textToSave;
      setLastFailedText(null);
      setSaveStatus(isOnline ? 'saved' : 'pending');

      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Autosave write failed:', err);
      if (previousStateSnapshot) {
        revertToSnapshot(previousStateSnapshot);
      }
      setLastFailedText(textToSave);
      setSaveStatus('error');
    }
  };

  // Flush any pending debounced free text write
  const flushFreeText = (textToFlush?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const text = textToFlush !== undefined ? textToFlush : freeText;
    const trimmed = text.trim();
    if (trimmed !== lastPersistedTextRef.current) {
      const snapshot: HistorySnapshot = {
        isFreeWriting: true,
        freeText: lastPersistedTextRef.current,
        selectedSurahNumber,
        fromAyah,
        toAyah,
        formattedText: lastPersistedTextRef.current,
      };
      performWrite(trimmed, snapshot);
    }
  };

  // Input change with 500ms debounce
  const handleFreeTextChange = (newText: string) => {
    setFreeText(newText);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      flushFreeText(newText);
    }, 500);
  };

  // Close handler: flush pending debounced text first, then close
  const handleClose = () => {
    if (isFreeWriting) {
      flushFreeText();
    }
    onClose();
  };

  // Keyboard navigation & Escape handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdown) {
          setOpenDropdown(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openDropdown]);

  // Update anchored position when open dropdown changes
  const updateDropdownCoords = (type: 'surah' | 'status' | 'from' | 'to') => {
    let trigger: HTMLElement | null = null;
    let minWidth = 96;
    const dropdownHeight = 288;

    if (type === 'surah') {
      trigger = surahTriggerRef.current;
      minWidth = 220;
    } else if (type === 'status') {
      trigger = statusTriggerRef.current;
      minWidth = 180;
    } else if (type === 'from') {
      trigger = fromTriggerRef.current;
      minWidth = 96;
    } else if (type === 'to') {
      trigger = toTriggerRef.current;
      minWidth = 96;
    }

    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const top = openUpwards
      ? Math.max(8, rect.top - dropdownHeight - 4)
      : Math.min(viewportHeight - dropdownHeight - 8, rect.bottom + 4);

    const width = Math.max(minWidth, rect.width);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }

    setDropdownCoords({ top, left, width, openUpwards });
  };

  const toggleDropdown = (type: 'surah' | 'status' | 'from' | 'to') => {
    if (openDropdown === type) {
      setOpenDropdown(null);
    } else {
      updateDropdownCoords(type);
      setOpenDropdown(type);
      if (type === 'surah') {
        setSurahSearch('');
      }
    }
  };

  // Keep dropdown anchored on resize / scroll
  useEffect(() => {
    if (!openDropdown) return;
    const handleReposition = () => {
      updateDropdownCoords(openDropdown);
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [openDropdown]);

  // Scroll dropdown list so CURRENT item is the first visible row
  useEffect(() => {
    if (openDropdown === 'surah') {
      requestAnimationFrame(() => {
        if (currentSurahItemRef.current && surahListRef.current) {
          const container = surahListRef.current;
          const item = currentSurahItemRef.current;
          container.scrollTop = item.offsetTop - container.offsetTop;
        }
      });
    } else if (openDropdown === 'from') {
      requestAnimationFrame(() => {
        if (currentFromItemRef.current && fromListRef.current) {
          const container = fromListRef.current;
          const item = currentFromItemRef.current;
          container.scrollTop = item.offsetTop - container.offsetTop;
        }
      });
    } else if (openDropdown === 'to') {
      requestAnimationFrame(() => {
        if (currentToItemRef.current && toListRef.current) {
          const container = toListRef.current;
          const item = currentToItemRef.current;
          container.scrollTop = item.offsetTop - container.offsetTop;
        }
      });
    }
  }, [openDropdown]);

  // Filter surahs by Arabic name ignoring diacritics and hamza variants
  const filteredSurahs = QURAN_SURAHS.filter((s) => {
    if (!surahSearch.trim()) return true;
    const normQ = normalizeArabicName(surahSearch);
    const normS = normalizeArabicName(s.arabicName);
    return normS.includes(normQ);
  });

  // Action: Choose Surah -> writes surah + From=1 + To=totalAyahs together immediately
  const handleSelectSurah = (surahNum: number) => {
    const surah = QURAN_SURAHS.find((s) => s.number === surahNum);
    if (!surah) return;
    const maxAyah = surah.ayahCount;

    if (surahNum === selectedSurahNumber && fromAyah === 1 && toAyah === maxAyah && !isFreeWriting) {
      setOpenDropdown(null);
      return;
    }

    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
    };

    setSelectedSurahNumber(surahNum);
    setFromAyah(1);
    setToAyah(maxAyah);
    setIsFreeWriting(false);
    setOpenDropdown(null);
    surahTriggerRef.current?.focus();

    const formatted = formatQuranHomework(surah.arabicName, 1, maxAyah, maxAyah);
    performWrite(formatted, prevSnapshot);
  };

  // Action: Choose From -> apply rules, persist valid corrected values immediately
  const handleSelectFrom = (val: number) => {
    let newFrom = val;
    let newTo = toAyah;
    if (newFrom > newTo) {
      newTo = newFrom;
    }
    newTo = Math.min(newTo, currentSurah.ayahCount);
    newFrom = Math.min(newFrom, currentSurah.ayahCount);

    if (newFrom === fromAyah && newTo === toAyah && !isFreeWriting) {
      setOpenDropdown(null);
      return;
    }

    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
    };

    setFromAyah(newFrom);
    setToAyah(newTo);
    setIsFreeWriting(false);
    setOpenDropdown(null);
    fromTriggerRef.current?.focus();

    const formatted = formatQuranHomework(currentSurah.arabicName, newFrom, newTo, currentSurah.ayahCount);
    performWrite(formatted, prevSnapshot);
  };

  // Action: Choose To -> apply rules, persist valid corrected values immediately
  const handleSelectTo = (val: number) => {
    let newTo = val;
    let newFrom = fromAyah;
    if (newTo < newFrom) {
      newFrom = newTo;
    }
    newTo = Math.min(newTo, currentSurah.ayahCount);
    newFrom = Math.max(1, newFrom);

    if (newFrom === fromAyah && newTo === toAyah && !isFreeWriting) {
      setOpenDropdown(null);
      return;
    }

    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
    };

    setFromAyah(newFrom);
    setToAyah(newTo);
    setIsFreeWriting(false);
    setOpenDropdown(null);
    toTriggerRef.current?.focus();

    const formatted = formatQuranHomework(currentSurah.arabicName, newFrom, newTo, currentSurah.ayahCount);
    performWrite(formatted, prevSnapshot);
  };

  // Action: Choose Status -> writes status immediately
  const handleSelectStatus = (statusValue: SurahMemorizationStatus) => {
    if (statusValue === currentStatus) {
      setOpenDropdown(null);
      return;
    }

    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
      surahStatus: { surahNumber: activeSurahNumber, status: currentStatus },
    };

    setOpenDropdown(null);
    statusTriggerRef.current?.focus();

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setSaveStatus(isOnline ? 'saving' : 'pending');

    try {
      onUpdateSurahStatus?.(activeSurahNumber, statusValue);
      setUndoSnapshot(prevSnapshot);
      setUndoExpiresAt(Date.now() + 5000);
      setSaveStatus(isOnline ? 'saved' : 'pending');

      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Status update failed:', err);
      setSaveStatus('error');
    }
  };

  const isFullSurah = fromAyah === 1 && toAyah === currentSurah.ayahCount;

  const prevSurah =
    selectedSurahNumber > 1
      ? QURAN_SURAHS.find((s) => s.number === selectedSurahNumber - 1)
      : null;

  const nextSurah =
    selectedSurahNumber < 114
      ? QURAN_SURAHS.find((s) => s.number === selectedSurahNumber + 1)
      : null;

  // Action: Grade change
  const handleGradeChange = (newGrade: GradeValue | null) => {
    onUpdateGrade?.(newGrade);
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setSaveStatus(isOnline ? 'saved' : 'pending');
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 1500);
  };

  // Action: Previous / Next surah -> writes immediately
  const handleNavigateSurah = (targetSurahNum: number) => {
    const target = QURAN_SURAHS.find((s) => s.number === targetSurahNum);
    if (!target || targetSurahNum === selectedSurahNumber) return;

    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
    };

    setSelectedSurahNumber(target.number);
    setFromAyah(1);
    setToAyah(target.ayahCount);
    setIsFreeWriting(false);

    const formatted = formatQuranHomework(target.arabicName, 1, target.ayahCount, target.ayahCount);
    performWrite(formatted, prevSnapshot);
  };

  // Action: Full Surah button -> writes immediately
  const handleToggleFullSurah = () => {
    const prevSnapshot: HistorySnapshot = {
      isFreeWriting,
      freeText,
      selectedSurahNumber,
      fromAyah,
      toAyah,
      formattedText: lastPersistedTextRef.current,
    };

    let newFrom = 1;
    let newTo = currentSurah.ayahCount;
    if (isFullSurah) {
      newTo = Math.min(16, currentSurah.ayahCount);
    }

    setFromAyah(newFrom);
    setToAyah(newTo);
    setIsFreeWriting(false);

    const formatted = formatQuranHomework(currentSurah.arabicName, newFrom, newTo, currentSurah.ayahCount);
    performWrite(formatted, prevSnapshot);
  };

  // Action: Undo
  const handleUndo = () => {
    if (!undoSnapshot) return;
    const snap = undoSnapshot;
    setUndoSnapshot(null);
    setUndoExpiresAt(0);

    setIsFreeWriting(snap.isFreeWriting);
    setFreeText(snap.freeText);
    setSelectedSurahNumber(snap.selectedSurahNumber);
    setFromAyah(snap.fromAyah);
    setToAyah(snap.toAyah);

    if (snap.surahStatus) {
      onUpdateSurahStatus?.(snap.surahStatus.surahNumber, snap.surahStatus.status);
    }

    onSave(snap.formattedText);
    lastPersistedTextRef.current = snap.formattedText;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setSaveStatus(isOnline ? 'saved' : 'pending');
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 1500);
  };

  // Action: Retry failed write
  const handleRetry = () => {
    if (!lastFailedText) return;
    performWrite(lastFailedText);
  };

  // Action: Mode toggle (Quran picker <-> Custom text)
  const handleToggleMode = () => {
    if (isFreeWriting) {
      flushFreeText();
      setIsFreeWriting(false);
      const formatted = formatQuranHomework(
        currentSurah.arabicName,
        fromAyah,
        toAyah,
        currentSurah.ayahCount
      );
      performWrite(formatted);
    } else {
      setIsFreeWriting(true);
    }
  };

  // Numbers 1 to total ayahs
  const ayahNumbers = Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1);

  return createPortal(
    <div
      ref={backdropRef}
      id="homework-dialog-backdrop"
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 animate-fade-in select-none"
      style={{
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      {/* Centered Modal Dialog (No CSS transform in resting state) */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="homework-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
          maxHeight: '90dvh',
          backgroundColor: '#F8F5EC',
          border: '1px solid #E4DCC8',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,.25)',
          padding: '12px 14px 14px',
        }}
        className="flex flex-col relative text-[#1F2A3D] font-sans antialiased"
        dir="ltr"
      >
        {/* Header Row (title on left; on right, in this order: status chip, pencil button, X button) */}
        <div className="flex items-center justify-between border-b border-[#E4DCC8] pb-2 mb-3 shrink-0 select-none">
          {/* Left: Book icon + Title */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <BookOpen className="w-4 h-4 text-[#B8860B] shrink-0" />
            <h2
              id="homework-dialog-title"
              className="font-bold text-sm sm:text-base text-[#0E5C56] leading-none truncate"
            >
              {taskTitle}
            </h2>
          </div>

          {/* Right: In exact order [status chip, pencil button, X button] */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status chip with reserved width (~96px) so header never shifts */}
            <div
              aria-live="polite"
              className="min-w-[96px] h-7 flex items-center justify-end"
            >
              {saveStatus === 'error' ? (
                <div className="h-7 px-2 bg-[#FCEBEB] text-[#791F1F] rounded-full flex items-center gap-1 text-[12px] font-semibold border border-[#791F1F]/20">
                  <span>Not saved</span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="underline font-bold hover:opacity-80 cursor-pointer ml-1"
                  >
                    Retry
                  </button>
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
              ) : (saveStatus === 'saved' || undoSnapshot) ? (
                <div className="h-7 px-2.5 bg-[#E1F5EE] text-[#085041] rounded-full flex items-center gap-1 text-[13px] font-medium transition-all shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#085041] shrink-0" />
                  <span>Saved</span>
                  {undoSnapshot && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="underline text-[12px] font-bold ml-1 text-[#085041] hover:text-[#063d31] cursor-pointer"
                    >
                      Undo
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Pencil button (toggles custom text) */}
            <button
              type="button"
              onClick={handleToggleMode}
              aria-label={isFreeWriting ? 'Switch to Quran Picker' : 'Switch to Custom Text'}
              title={isFreeWriting ? 'Switch to Quran Picker' : 'Switch to Custom Text'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isFreeWriting
                  ? 'bg-[#156E67] text-white border-[#156E67]'
                  : 'bg-white text-gray-600 border-[#E4DCC8] hover:bg-gray-50'
              }`}
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* X button (36px+, closes dialog, flushes pending write) */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              title="Close"
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-black/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dialog Body (scrolls internally if needed) */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {isFreeWriting ? (
            /* Custom Text Input Mode */
            <div className="space-y-3 py-1">
              <input
                type="text"
                value={freeText}
                onChange={(e) => handleFreeTextChange(e.target.value)}
                onBlur={() => flushFreeText()}
                placeholder="اكتب نص الواجب المخصص (مثال: مراجعة الجزء 28)..."
                className="w-full bg-white border border-[#D3CDBB] rounded-[12px] px-3.5 py-2.5 text-sm font-bold text-[#1F2A3D] focus:outline-none focus:ring-2 focus:ring-[#156E67]/40 text-right shadow-2xs"
                dir="auto"
                autoFocus
              />

              {/* Status & Grade in free text mode */}
              <div className="flex items-center justify-between bg-white border border-[#D3CDBB] rounded-[12px] p-2.5 shadow-2xs">
                <span className="text-xs font-semibold text-[#0E5C56]" dir="rtl">
                  {detectedSurah ? `سورة ${detectedSurah.arabicName}` : 'التقييم'}
                </span>
                <div className="flex items-center gap-2">
                  <GradeBadge
                    grade={grade ?? null}
                    editable={isTeacherMode}
                    onChange={handleGradeChange}
                    idPrefix="free-grade"
                  />
                  {detectedSurah && (
                    <button
                      type="button"
                      ref={statusTriggerRef}
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown === 'status'}
                      onClick={() => toggleDropdown('status')}
                      className="h-10 px-3 bg-white border border-[#D3CDBB] rounded-lg flex items-center gap-2 cursor-pointer hover:border-[#156E67]"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                        style={{ backgroundColor: currentStatusMeta.bgColor }}
                      />
                      <span className="text-xs font-semibold text-[#1F2A3D]">
                        {currentStatusMeta.shortLabel}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Quran Picker Mode */
            <>
              {/* Row 1: [surah field | status button] */}
              <div className="flex items-center gap-2.5 w-full">
                {/* 2) SURAH FIELD (flex: 1, Arabic name only, 20px, weight 700 + chevron-down) */}
                <button
                  type="button"
                  ref={surahTriggerRef}
                  aria-haspopup="listbox"
                  aria-expanded={openDropdown === 'surah'}
                  onClick={() => toggleDropdown('surah')}
                  className="flex-1 min-w-[170px] h-[52px] bg-white border border-[#D3CDBB] rounded-[12px] px-3.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#156E67] focus:outline-none focus:ring-2 focus:ring-[#156E67]/30 transition-all select-none"
                >
                  <span className="text-[20px] font-bold text-[#1F2A3D] truncate" dir="rtl">
                    {currentSurah.arabicName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-2" />
                </button>

                {/* 1) STATUS BUTTON (compact, height 52px, radius 12px, white, 1px border) */}
                <button
                  type="button"
                  ref={statusTriggerRef}
                  aria-haspopup="listbox"
                  aria-expanded={openDropdown === 'status'}
                  onClick={() => toggleDropdown('status')}
                  className="h-[52px] bg-white border border-[#D3CDBB] rounded-[12px] px-3 flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:border-[#156E67] focus:outline-none focus:ring-2 focus:ring-[#156E67]/30 transition-all shrink-0 select-none min-w-[125px]"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                    style={{ backgroundColor: currentStatusMeta.bgColor }}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-[#1F2A3D] truncate">
                    {currentStatusMeta.shortLabel}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" />
                </button>
              </div>

              {/* Row 2: [From field -> To field | GradeBadge] (52px high, radius 12px, white, 1px border, centered 20px weight 500) */}
              <div className="flex items-center gap-2 sm:gap-2.5 w-full">
                {/* From field */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#5B6478] px-1">From</span>
                  <button
                    type="button"
                    ref={fromTriggerRef}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === 'from'}
                    onClick={() => toggleDropdown('from')}
                    className="w-full h-[52px] bg-white border border-[#D3CDBB] rounded-[12px] px-3 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#156E67] focus:outline-none focus:ring-2 focus:ring-[#156E67]/30 transition-all"
                  >
                    <span className="flex-1 text-center text-[20px] font-medium text-[#1F2A3D] tabular-nums">
                      {fromAyah}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </div>

                {/* Arrow Icon between them */}
                <div className="shrink-0 pt-4 flex items-center justify-center">
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-[#0E5C56]" />
                </div>

                {/* To field */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#5B6478] px-1">To</span>
                  <button
                    type="button"
                    ref={toTriggerRef}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === 'to'}
                    onClick={() => toggleDropdown('to')}
                    className="w-full h-[52px] bg-white border border-[#D3CDBB] rounded-[12px] px-3 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#156E67] focus:outline-none focus:ring-2 focus:ring-[#156E67]/30 transition-all"
                  >
                    <span className="flex-1 text-center text-[20px] font-medium text-[#1F2A3D] tabular-nums">
                      {toAyah}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </div>

                {/* Grade Badge (next to 22 / To field) */}
                <div className="shrink-0 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#5B6478] px-1 text-center">Grade</span>
                  <GradeBadge
                    grade={grade ?? null}
                    editable={isTeacherMode}
                    onChange={handleGradeChange}
                    idPrefix="modal-grade"
                    size="editor"
                  />
                </div>
              </div>

              {/* Row 3: [‹  السورة كاملة  ›] */}
              <div className="flex items-center gap-1.5 pt-1">
                {/* Prev Surah */}
                <button
                  type="button"
                  onClick={() => prevSurah && handleNavigateSurah(prevSurah.number)}
                  disabled={!prevSurah}
                  className="flex-1 min-h-[44px] py-1.5 px-2 bg-white hover:bg-slate-100 disabled:opacity-40 border border-[#D3CDBB] rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:pointer-events-none shadow-2xs"
                  title={prevSurah ? `السورة السابقة: ${prevSurah.arabicName}` : ''}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                  <span className="truncate">{prevSurah ? prevSurah.arabicName : 'السابقة'}</span>
                </button>

                {/* Toggle Full Surah */}
                <button
                  type="button"
                  onClick={handleToggleFullSurah}
                  className={`flex-1 min-h-[44px] py-1.5 px-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs ${
                    isFullSurah
                      ? 'bg-[#156E67] text-white border-[#156E67]'
                      : 'bg-white hover:bg-[#EAF6EE] text-[#0E5C56] border-[#D3CDBB]'
                  }`}
                >
                  <span>{isFullSurah ? 'كاملة ✓' : 'السورة كاملة'}</span>
                </button>

                {/* Next Surah */}
                <button
                  type="button"
                  onClick={() => nextSurah && handleNavigateSurah(nextSurah.number)}
                  disabled={!nextSurah}
                  className="flex-1 min-h-[44px] py-1.5 px-2 bg-white hover:bg-slate-100 disabled:opacity-40 border border-[#D3CDBB] rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:pointer-events-none shadow-2xs"
                  title={nextSurah ? `السورة التالية: ${nextSurah.arabicName}` : ''}
                >
                  <span className="truncate">{nextSurah ? nextSurah.arabicName : 'التالية'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== ANCHORED DROPDOWNS (PORTALED ABOVE DIALOG) ==================== */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {openDropdown && dropdownCoords && createPortal(
        <div
          role="listbox"
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
            maxHeight: '288px',
            zIndex: 100000,
            WebkitOverflowScrolling: 'touch',
          }}
          className="bg-white border border-[#D3CDBB] rounded-[12px] shadow-xl overflow-hidden flex flex-col animate-fade-in text-[#1F2A3D]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* SURAH DROPDOWN */}
          {openDropdown === 'surah' && (
            <>
              {/* Sticky Search Input (40px, placeholder "Search", NOT auto-focused) */}
              <div className="sticky top-0 z-10 bg-white p-2 border-b border-[#D3CDBB]/60">
                <input
                  type="text"
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full h-10 px-3 text-sm bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E5C56] text-right"
                  dir="rtl"
                />
              </div>

              {/* Surah List: 114 surahs in mushaf order, Arabic names only (18px, weight 600, dir="rtl") */}
              <div ref={surahListRef} className="overflow-y-auto flex-1 divide-y divide-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
                {filteredSurahs.map((s) => {
                  const isSelected = s.number === currentSurah.number;
                  return (
                    <button
                      key={`surah-${s.number}`}
                      ref={isSelected ? currentSurahItemRef : undefined}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => handleSelectSurah(s.number)}
                      className={`w-full min-h-[46px] h-12 px-3.5 flex items-center justify-between text-right cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#E1F5EE]' : 'hover:bg-[#F8F5EC]'
                      }`}
                    >
                      <div className="w-5 shrink-0 flex items-center justify-center">
                        {isSelected && <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5]" />}
                      </div>
                      <span className="text-[18px] font-semibold text-[#1F2A3D] flex-1 text-right" dir="rtl">
                        {s.arabicName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STATUS DROPDOWN */}
          {openDropdown === 'status' && (
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 p-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {SURAH_STATUS_OPTIONS.map((opt) => {
                const isSelected = opt.value === currentStatus;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelectStatus(opt.value)}
                    className={`w-full min-h-[46px] h-12 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#E1F5EE]' : 'hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                        style={{ backgroundColor: opt.bgColor }}
                      />
                      <span className="text-xs sm:text-sm font-semibold text-[#1F2A3D]">
                        {opt.shortLabel}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* FROM AYAH DROPDOWN */}
          {openDropdown === 'from' && (
            <div ref={fromListRef} className="overflow-y-auto flex-1 divide-y divide-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
              {ayahNumbers.map((num) => {
                const isSelected = num === fromAyah;
                return (
                  <button
                    key={`from-${num}`}
                    ref={isSelected ? currentFromItemRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelectFrom(num)}
                    className={`w-full min-h-[46px] h-12 px-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#E1F5EE]' : 'hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <span className="text-[18px] font-medium text-[#1F2A3D] tabular-nums flex-1 text-center">
                      {num}
                    </span>
                    <div className="w-4 shrink-0 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TO AYAH DROPDOWN */}
          {openDropdown === 'to' && (
            <div ref={toListRef} className="overflow-y-auto flex-1 divide-y divide-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
              {ayahNumbers.map((num) => {
                const isSelected = num === toAyah;
                return (
                  <button
                    key={`to-${num}`}
                    ref={isSelected ? currentToItemRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelectTo(num)}
                    className={`w-full min-h-[46px] h-12 px-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#E1F5EE]' : 'hover:bg-[#F8F5EC]'
                    }`}
                  >
                    <span className="text-[18px] font-medium text-[#1F2A3D] tabular-nums flex-1 text-center">
                      {num}
                    </span>
                    <div className="w-4 shrink-0 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};
