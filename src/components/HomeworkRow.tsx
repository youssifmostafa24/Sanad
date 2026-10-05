import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Layers, Trash2 } from 'lucide-react';
import { Entry, GradeValue, SurahMemorizationStatus } from '../types';
import { getWeekdayShort, getDayOfMonth } from '../utils/dateUtils';
import { GradeBadge } from './GradeBadge';
import { OnTimeBadge } from './OnTimeBadge';
import { InlineHomeworkEditor } from './InlineHomeworkEditor';
import {
  normalizeQuranHomeworkText,
  parseQuranHomework,
  parseHomeworkDisplay,
  getSurahFromHomework,
} from '../data/quranSurahs';

interface HomeworkRowProps {
  entry: Entry;
  isTeacherMode: boolean;
  isMostRecentUngraded: boolean;
  isSingleMostRecentInView: boolean;
  selectedMonthPrefix?: string;
  studentSurahRatings?: Record<number, SurahMemorizationStatus>;
  showOnTime?: boolean;
  isHighlighted?: boolean;
  onUpdateEntry: (updated: Entry) => void;
  onDeleteEntry: (entryId: string, entryDate?: string) => void;
  onDuplicateEntry?: (entry: Entry) => void;
  onUpdateSurahStatus?: (surahNumber: number, status: SurahMemorizationStatus) => void;
}

export const HomeworkRow: React.FC<HomeworkRowProps> = React.memo(({
  entry,
  isTeacherMode,
  isMostRecentUngraded,
  isSingleMostRecentInView,
  selectedMonthPrefix,
  studentSurahRatings,
  showOnTime = false,
  isHighlighted = false,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateSurahStatus,
}) => {
  const weekday = getWeekdayShort(entry.date);
  const dayOfMonth = getDayOfMonth(entry.date);

  const cardBorder = 'bg-white';

  const [pickerTarget, setPickerTarget] = useState<'hifz' | 'murajaa' | 'third' | 'fourth' | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Day Actions Dropdown (anchored to whole date card)
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const actionsButtonRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  const [actionsCoords, setActionsCoords] = useState<{ top: number; left: number } | null>(null);

  // Determine current active count of homeworks (1, 2, 3, or 4)
  const activeCount: number =
    entry.homeworkCount && entry.homeworkCount >= 1 && entry.homeworkCount <= 4
      ? entry.homeworkCount
      : (entry.fourthText !== undefined || entry.fourthGrade !== undefined)
      ? 4
      : (entry.thirdText !== undefined || entry.thirdGrade !== undefined)
      ? 3
      : 2;

  const updateActionsPosition = () => {
    if (!actionsButtonRef.current) return;
    const rect = actionsButtonRef.current.getBoundingClientRect();
    const dropdownWidth = 230;
    const dropdownHeight = isConfirmingDelete ? 260 : 220;

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10;
    }
    if (left < 10) left = 10;

    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    const top = shouldOpenUpwards ? rect.top - dropdownHeight - 6 : rect.bottom + 6;

    setActionsCoords({
      top: Math.max(10, Math.min(window.innerHeight - dropdownHeight - 10, top)),
      left,
    });
  };

  useEffect(() => {
    if (!isActionsOpen) {
      setIsConfirmingDelete(false);
      return;
    }
    updateActionsPosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        actionsButtonRef.current &&
        !actionsButtonRef.current.contains(target) &&
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(target)
      ) {
        setIsActionsOpen(false);
        setIsConfirmingDelete(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsActionsOpen(false);
        setIsConfirmingDelete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updateActionsPosition, true);
    window.addEventListener('resize', updateActionsPosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updateActionsPosition, true);
      window.removeEventListener('resize', updateActionsPosition);
    };
  }, [isActionsOpen, isConfirmingDelete]);

  const handlePickerSelect = (formattedText: string) => {
    if (pickerTarget === 'hifz') {
      handleHifzTextChange(formattedText);
    } else if (pickerTarget === 'murajaa') {
      handleMurajaaTextChange(formattedText);
    } else if (pickerTarget === 'third') {
      handleThirdTextChange(formattedText);
    } else if (pickerTarget === 'fourth') {
      handleFourthTextChange(formattedText);
    }
  };

  const handleHifzTextChange = (text: string) => {
    onUpdateEntry({ ...entry, hifzText: normalizeQuranHomeworkText(text) });
  };

  const handleHifzGradeChange = (grade: GradeValue | null) => {
    onUpdateEntry({ ...entry, hifzGrade: grade });
  };

  const handleMurajaaTextChange = (text: string) => {
    onUpdateEntry({ ...entry, murajaaText: normalizeQuranHomeworkText(text) });
  };

  const handleMurajaaGradeChange = (grade: GradeValue | null) => {
    onUpdateEntry({ ...entry, murajaaGrade: grade });
  };

  const handleThirdTextChange = (text: string) => {
    onUpdateEntry({ ...entry, thirdText: normalizeQuranHomeworkText(text) });
  };

  const handleThirdGradeChange = (grade: GradeValue | null) => {
    onUpdateEntry({ ...entry, thirdGrade: grade });
  };

  const handleFourthTextChange = (text: string) => {
    onUpdateEntry({ ...entry, fourthText: normalizeQuranHomeworkText(text) });
  };

  const handleFourthGradeChange = (grade: GradeValue | null) => {
    onUpdateEntry({ ...entry, fourthGrade: grade });
  };

  const handleSetHomeworkCount = (newCount: number) => {
    const updated: Entry = { ...entry, homeworkCount: newCount };
    if (newCount >= 2 && updated.murajaaText === undefined) {
      updated.murajaaText = '';
      updated.murajaaGrade = null;
    }
    if (newCount >= 3 && updated.thirdText === undefined) {
      updated.thirdText = '';
      updated.thirdGrade = null;
    }
    if (newCount >= 4 && updated.fourthText === undefined) {
      updated.fourthText = '';
      updated.fourthGrade = null;
    }
    onUpdateEntry(updated);
  };

  const handleExecuteDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionsOpen(false);
    setIsConfirmingDelete(false);
    onDeleteEntry(entry.id, entry.date);
  };

  const handleDateChange = (newDate: string) => {
    if (newDate && newDate !== entry.date) {
      onUpdateEntry({ ...entry, date: newDate });
    }
  };

  // Find active surah rating for picker
  const activeText =
    pickerTarget === 'hifz'
      ? entry.hifzText
      : pickerTarget === 'murajaa'
      ? entry.murajaaText
      : pickerTarget === 'third'
      ? entry.thirdText || ''
      : entry.fourthText || '';
  const parsedTarget = parseQuranHomework(activeText);
  const targetSurahStatus =
    parsedTarget && studentSurahRatings
      ? studentSurahRatings[parsedTarget.surahNumber] || 'not_memorized'
      : 'not_memorized';

  const parsedHifz = parseHomeworkDisplay(entry.hifzText);
  const cleanMurajaa = entry.murajaaText ? entry.murajaaText.replace(/^(Review|ريفيو|حفظ)\s*:\s*/i, '') : '';
  const parsedMurajaa = parseHomeworkDisplay(cleanMurajaa);

  const cleanThird = entry.thirdText ? entry.thirdText.replace(/^(Third|مهمة|تسميع|حفظ|مراجعة)\s*:\s*/i, '') : '';
  const parsedThird = parseHomeworkDisplay(cleanThird || entry.thirdText || '');

  const cleanFourth = entry.fourthText ? entry.fourthText.replace(/^(Fourth|رابع|مهمة|تسميع|حفظ|مراجعة)\s*:\s*/i, '') : '';
  const parsedFourth = parseHomeworkDisplay(cleanFourth || entry.fourthText || '');

  const hifzSurah = getSurahFromHomework(entry.hifzText);
  const hifzSurahStatus =
    hifzSurah && studentSurahRatings && studentSurahRatings[hifzSurah.number]
      ? studentSurahRatings[hifzSurah.number]
      : 'strong';

  const murajaaSurah = getSurahFromHomework(cleanMurajaa || entry.murajaaText);
  const murajaaSurahStatus =
    murajaaSurah && studentSurahRatings && studentSurahRatings[murajaaSurah.number]
      ? studentSurahRatings[murajaaSurah.number]
      : 'medium';

  const thirdSurah = getSurahFromHomework(cleanThird || entry.thirdText || '');
  const thirdSurahStatus =
    thirdSurah && studentSurahRatings && studentSurahRatings[thirdSurah.number]
      ? studentSurahRatings[thirdSurah.number]
      : 'in_progress';

  const fourthSurah = getSurahFromHomework(cleanFourth || entry.fourthText || '');
  const fourthSurahStatus =
    fourthSurah && studentSurahRatings && studentSurahRatings[fourthSurah.number]
      ? studentSurahRatings[fourthSurah.number]
      : 'in_progress';

  return (
    <div
      id={`entry-row-${entry.id}`}
      className={`flex items-stretch gap-1.5 sm:gap-2 w-full group transition-all duration-300 rounded-2xl ${
        isHighlighted
          ? 'ring-2 ring-[#B8860B] ring-offset-2 ring-offset-[#FBF6E8] scale-[1.01] shadow-md'
          : ''
      }`}
    >
      {/* Left Card: Date Tile (Whole card is interactive in teacher mode; 3 dots removed) */}
      <div
        ref={actionsButtonRef}
        id={`date-card-${entry.id}`}
        onClick={isTeacherMode ? (e) => {
          e.stopPropagation();
          setIsActionsOpen((prev) => !prev);
        } : undefined}
        role={isTeacherMode ? 'button' : undefined}
        tabIndex={isTeacherMode ? 0 : undefined}
        aria-label={isTeacherMode ? `Manage Day ${weekday} ${dayOfMonth}` : undefined}
        aria-expanded={isTeacherMode ? isActionsOpen : undefined}
        onKeyDown={isTeacherMode ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsActionsOpen((prev) => !prev);
          }
        } : undefined}
        className={`relative w-13 sm:w-16 rounded-2xl flex flex-col items-center justify-center shrink-0 py-2 sm:py-2.5 px-0.5 text-center transition-all select-none ${
          isSingleMostRecentInView
            ? 'bg-[#156E67] shadow-xs'
            : 'bg-white'
        } ${
          isTeacherMode
            ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-[#0E5C56]/35 active:scale-95'
            : ''
        }`}
        title={isTeacherMode ? 'إدارة اليوم (تغيير التاريخ، عدد الواجبات، حذف اليوم)' : undefined}
      >
        {/* Weekday - high contrast */}
        <span
          className={`text-[13.5px] sm:text-[15px] font-sans font-extrabold uppercase tracking-tight leading-none ${
            isSingleMostRecentInView ? 'text-white' : 'text-[#1F2A3D]'
          }`}
        >
          {weekday}
        </span>

        {/* Day of Month - regular font weight */}
        <span
          className={`text-[24px] sm:text-[28px] md:text-[30px] font-sans font-normal leading-none my-0.5 tabular-nums ${
            isSingleMostRecentInView ? 'text-white' : 'text-[#0E5C56]'
          }`}
        >
          {dayOfMonth}
        </span>
      </div>

      {/* Day Actions Dropdown Portal (Interactive management menu) */}
      {isTeacherMode && isActionsOpen && actionsCoords && createPortal(
        <div
          ref={actionsDropdownRef}
          id={`day-actions-menu-${entry.id}`}
          role="dialog"
          aria-label="Manage Day"
          style={{
            position: 'fixed',
            top: `${actionsCoords.top}px`,
            left: `${actionsCoords.left}px`,
            width: '230px',
            zIndex: 99999,
          }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2.5 font-sans select-none animate-in fade-in zoom-in-95 duration-100 text-left text-xs"
          onClick={(e) => e.stopPropagation()}
          dir="ltr"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-gray-100">
            <span className="font-bold text-[#0E5C56] text-[11px] uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0E5C56]" />
              <span>{weekday}, {dayOfMonth}</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {entry.date}
            </span>
          </div>

          {/* 1. Change Date Option */}
          <div className="pt-2 pb-1.5">
            <button
              type="button"
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker?.();
                } catch {
                  dateInputRef.current?.click();
                }
              }}
              className="w-full min-h-[38px] flex items-center justify-between px-2.5 py-2 rounded-xl font-bold text-[#1F2A3D] hover:bg-[#EAF6EE] hover:text-[#0E5C56] transition-all cursor-pointer active:scale-95 border border-gray-200/80 bg-slate-50/70"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E5C56] shrink-0" />
                <span>تغيير التاريخ (Change Date)</span>
              </div>
              <span className="text-[10px] text-[#0E5C56] font-bold underline">
                Pick
              </span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={entry.date}
              onChange={(e) => {
                handleDateChange(e.target.value);
                setIsActionsOpen(false);
              }}
              className="sr-only pointer-events-none"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {/* 2. Homework Tasks Count (1 - 2 - 3 - 4) */}
          <div className="py-2 border-t border-gray-100">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0E5C56]" />
                <span>عدد الواجبات (Tasks):</span>
              </span>
              <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/10 px-1.5 py-0.5 rounded-full tabular-nums">
                {activeCount} {activeCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Segmented Buttons 1 - 2 - 3 - 4 */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              {[1, 2, 3, 4].map((num) => {
                const isSelected = activeCount === num;
                return (
                  <button
                    key={`count-${num}`}
                    type="button"
                    onClick={() => handleSetHomeworkCount(num)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#0E5C56] text-white shadow-xs scale-102'
                        : 'text-[#1F2A3D] hover:bg-white/70 active:scale-95'
                    }`}
                    title={`${num} Homework Task${num > 1 ? 's' : ''}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Delete Day Button / Inline Confirmation (Reliable in sandboxed iframes) */}
          <div className="pt-2 border-t border-gray-100">
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                className="w-full min-h-[38px] flex items-center gap-2 px-2.5 py-2 rounded-xl font-bold text-red-600 hover:bg-red-50 cursor-pointer active:scale-95 transition-all text-left"
              >
                <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                <span>حذف اليوم (Delete Day)</span>
              </button>
            ) : (
              <div
                className="bg-red-50/90 border border-red-200 rounded-xl p-2.5 text-center animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[11px] font-bold text-red-700 mb-2 leading-tight">
                  هل أنت متأكد من حذف هذا اليوم بالكامل؟
                </p>
                <div className="flex items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDelete}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer transition-all shadow-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد الحذف</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Right Card: Day's homework portions (1 to 4 homework rows) */}
      <div
        id={`content-card-${entry.id}`}
        className={`flex-1 min-w-0 rounded-2xl sm:rounded-3xl py-1 px-2 sm:py-1.5 sm:px-2.5 flex flex-col justify-center relative transition-all ${cardBorder} min-h-[68px] sm:min-h-[72px] overflow-hidden`}
      >
        {/* Portion 1: Hifz Homework */}
        <div
          id={`hifz-row-${entry.id}`}
          className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
        >
            {isTeacherMode ? (
              <button
                id={`hifz-input-${entry.id}`}
                type="button"
                onClick={() => setPickerTarget('hifz')}
                className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1 px-1.5 -mx-1 rounded-xl text-left transition-all hover:bg-[#0E5C56]/5 active:scale-[0.99] cursor-pointer group/hifz focus:outline-none"
                title="اضغط لتغيير السورة والآيات (Click to change Surah & Ayahs)"
              >
                {parsedHifz ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight group-hover/hifz:text-[#0E5C56] transition-colors" dir="rtl">
                      {parsedHifz.surahName}
                    </span>
                    <span
                      className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                        parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة'
                          ? 'text-[#B8860B]'
                          : 'text-[#1F2A3D]'
                      }`}
                      dir={parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                    >
                      <span dir="ltr">{parsedHifz.ayahRange}</span>
                    </span>
                  </div>
                ) : entry.hifzText ? (
                  <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                    {entry.hifzText.replace(/[()]/g, '').trim()}
                  </span>
                ) : (
                  <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm group-hover/hifz:text-[#0E5C56]">Click to select Surah...</span>
                )}
              </button>
            ) : (
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1">
                <div className="leading-tight flex items-center gap-2 whitespace-nowrap truncate min-w-0">
                  {parsedHifz ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight" dir="rtl">
                        {parsedHifz.surahName}
                      </span>
                      <span
                        className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                          parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة'
                            ? 'text-[#B8860B]'
                            : 'text-[#1F2A3D]'
                        }`}
                        dir={parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                      >
                        <span dir="ltr">{parsedHifz.ayahRange}</span>
                      </span>
                    </div>
                  ) : entry.hifzText ? (
                    <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                      {entry.hifzText.replace(/[()]/g, '').trim()}
                    </span>
                  ) : (
                    <span className="text-[#5B6478] italic text-xs font-normal">No homework set</span>
                  )}
                </div>
              </div>
            )}

            {entry.hifzGrade !== null && entry.hifzGrade !== undefined && (
              <div className="shrink-0 flex items-center justify-end">
                <GradeBadge
                  grade={entry.hifzGrade}
                  editable={isTeacherMode}
                  onChange={handleHifzGradeChange}
                  idPrefix={`hifz-${entry.id}`}
                />
              </div>
            )}
          </div>

        {/* Portion 2: Murajaa Homework (Shown if activeCount >= 2) */}
        {activeCount >= 2 && (
          <>
            <div
              className="w-full border-t border-dashed border-[#B8860B]/20 sm:border-[#B8860B]/25 my-0.5 sm:my-1 shrink-0 pointer-events-none"
              aria-hidden="true"
            />
            <div
              id={`murajaa-row-${entry.id}`}
              className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
            >
                {isTeacherMode ? (
                  <button
                    id={`murajaa-input-${entry.id}`}
                    type="button"
                    onClick={() => setPickerTarget('murajaa')}
                    className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1 px-1.5 -mx-1 rounded-xl text-left transition-all hover:bg-[#0E5C56]/5 active:scale-[0.99] cursor-pointer group/murajaa focus:outline-none"
                    title="اضغط لتغيير السورة والآيات (Click to change Surah & Ayahs)"
                  >
                    {parsedMurajaa ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight group-hover/murajaa:text-[#0E5C56] transition-colors" dir="rtl">
                          {parsedMurajaa.surahName}
                        </span>
                        <span
                          className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                            parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة'
                              ? 'text-[#B8860B]'
                              : 'text-[#1F2A3D]'
                          }`}
                          dir={parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                        >
                          <span dir="ltr">{parsedMurajaa.ayahRange}</span>
                        </span>
                      </div>
                    ) : cleanMurajaa ? (
                      <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                        {cleanMurajaa.replace(/[()]/g, '').trim()}
                      </span>
                    ) : (
                      <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm group-hover/murajaa:text-[#0E5C56]">Click to select Surah...</span>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1">
                    <div className="leading-tight flex items-center gap-2 whitespace-nowrap truncate min-w-0">
                      {parsedMurajaa ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight" dir="rtl">
                            {parsedMurajaa.surahName}
                          </span>
                          <span
                            className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                              parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة'
                                ? 'text-[#B8860B]'
                               : 'text-[#1F2A3D]'
                            }`}
                            dir={parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                          >
                            <span dir="ltr">{parsedMurajaa.ayahRange}</span>
                          </span>
                        </div>
                      ) : cleanMurajaa ? (
                        <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                          {cleanMurajaa.replace(/[()]/g, '').trim()}
                        </span>
                      ) : (
                        <span className="text-[#5B6478] italic text-xs font-normal">No homework set</span>
                      )}
                    </div>
                  </div>
                )}

                {entry.murajaaGrade !== null && entry.murajaaGrade !== undefined && (
                  <div className="shrink-0 flex items-center justify-end">
                    <GradeBadge
                      grade={entry.murajaaGrade}
                      editable={isTeacherMode}
                      onChange={handleMurajaaGradeChange}
                      idPrefix={`murajaa-${entry.id}`}
                    />
                  </div>
                )}
              </div>
            </>
          )}

        {/* Portion 3: Third Homework Item (Shown if activeCount >= 3) */}
        {activeCount >= 3 && (
          <>
            <div
              className="w-full border-t border-dashed border-[#B8860B]/20 sm:border-[#B8860B]/25 my-0.5 sm:my-1 shrink-0 pointer-events-none"
              aria-hidden="true"
            />
            <div
              id={`third-row-${entry.id}`}
              className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
            >
                {isTeacherMode ? (
                  <button
                    id={`third-input-${entry.id}`}
                    type="button"
                    onClick={() => setPickerTarget('third')}
                    className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1 px-1.5 -mx-1 rounded-xl text-left transition-all hover:bg-[#0E5C56]/5 active:scale-[0.99] cursor-pointer group/third focus:outline-none"
                    title="اضغط لتغيير السورة والآيات (Click to change Surah & Ayahs)"
                  >
                    {parsedThird ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight group-hover/third:text-[#0E5C56] transition-colors" dir="rtl">
                          {parsedThird.surahName}
                        </span>
                        <span
                          className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                            parsedThird.isFullSurah || parsedThird.ayahRange === 'كاملة'
                              ? 'text-[#B8860B]'
                              : 'text-[#1F2A3D]'
                          }`}
                          dir={parsedThird.isFullSurah || parsedThird.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                        >
                          <span dir="ltr">{parsedThird.ayahRange}</span>
                        </span>
                      </div>
                    ) : cleanThird ? (
                      <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                        {cleanThird.replace(/[()]/g, '').trim()}
                      </span>
                    ) : (
                      <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm group-hover/third:text-[#0E5C56]">Click to select Surah...</span>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1">
                    <div className="leading-tight flex items-center gap-2 whitespace-nowrap truncate min-w-0">
                      {parsedThird ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight" dir="rtl">
                            {parsedThird.surahName}
                          </span>
                          <span
                            className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                              parsedThird.isFullSurah || parsedThird.ayahRange === 'كاملة'
                                ? 'text-[#B8860B]'
                                : 'text-[#1F2A3D]'
                            }`}
                            dir={parsedThird.isFullSurah || parsedThird.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                          >
                            <span dir="ltr">{parsedThird.ayahRange}</span>
                          </span>
                        </div>
                      ) : cleanThird ? (
                        <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                          {cleanThird.replace(/[()]/g, '').trim()}
                        </span>
                      ) : (
                        <span className="text-[#5B6478] italic text-xs font-normal">No homework set</span>
                      )}
                    </div>
                  </div>
                )}

                {entry.thirdGrade !== null && entry.thirdGrade !== undefined && (
                  <div className="shrink-0 flex items-center justify-end">
                    <GradeBadge
                      grade={entry.thirdGrade ?? null}
                      editable={isTeacherMode}
                      onChange={handleThirdGradeChange}
                      idPrefix={`third-${entry.id}`}
                    />
                  </div>
                )}
              </div>
            </>
          )}

        {/* Portion 4: Fourth Homework Item (Shown if activeCount >= 4) */}
        {activeCount >= 4 && (
          <>
            <div
              className="w-full border-t border-dashed border-[#B8860B]/20 sm:border-[#B8860B]/25 my-0.5 sm:my-1 shrink-0 pointer-events-none"
              aria-hidden="true"
            />
            <div
              id={`fourth-row-${entry.id}`}
              className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
            >
                {isTeacherMode ? (
                  <button
                    id={`fourth-input-${entry.id}`}
                    type="button"
                    onClick={() => setPickerTarget('fourth')}
                    className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1 px-1.5 -mx-1 rounded-xl text-left transition-all hover:bg-[#0E5C56]/5 active:scale-[0.99] cursor-pointer group/fourth focus:outline-none"
                    title="اضغط لتغيير السورة والآيات (Click to change Surah & Ayahs)"
                  >
                    {parsedFourth ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight group-hover/fourth:text-[#0E5C56] transition-colors" dir="rtl">
                          {parsedFourth.surahName}
                        </span>
                        <span
                          className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                            parsedFourth.isFullSurah || parsedFourth.ayahRange === 'كاملة'
                              ? 'text-[#B8860B]'
                              : 'text-[#1F2A3D]'
                          }`}
                          dir={parsedFourth.isFullSurah || parsedFourth.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                        >
                          <span dir="ltr">{parsedFourth.ayahRange}</span>
                        </span>
                      </div>
                    ) : cleanFourth ? (
                      <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                        {cleanFourth.replace(/[()]/g, '').trim()}
                      </span>
                    ) : (
                      <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm group-hover/fourth:text-[#0E5C56]">Click to select Surah...</span>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-1">
                    <div className="leading-tight flex items-center gap-2 whitespace-nowrap truncate min-w-0">
                      {parsedFourth ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#1F2A3D] font-sans font-bold text-base sm:text-lg truncate leading-tight" dir="rtl">
                            {parsedFourth.surahName}
                          </span>
                          <span
                            className={`px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 font-bold text-sm sm:text-base tabular-nums leading-none tracking-tight shrink-0 shadow-2xs ${
                              parsedFourth.isFullSurah || parsedFourth.ayahRange === 'كاملة'
                                ? 'text-[#B8860B]'
                                : 'text-[#1F2A3D]'
                            }`}
                            dir={parsedFourth.isFullSurah || parsedFourth.ayahRange === 'كاملة' ? 'rtl' : 'ltr'}
                          >
                            <span dir="ltr">{parsedFourth.ayahRange}</span>
                          </span>
                        </div>
                      ) : cleanFourth ? (
                        <span className="text-[#1F2A3D] font-sans font-medium text-sm sm:text-base truncate" dir="auto">
                          {cleanFourth.replace(/[()]/g, '').trim()}
                        </span>
                      ) : (
                        <span className="text-[#5B6478] italic text-xs font-normal">No homework set</span>
                      )}
                    </div>
                  </div>
                )}

                {entry.fourthGrade !== null && entry.fourthGrade !== undefined && (
                  <div className="shrink-0 flex items-center justify-end">
                    <GradeBadge
                      grade={entry.fourthGrade ?? null}
                      editable={isTeacherMode}
                      onChange={handleFourthGradeChange}
                      idPrefix={`fourth-${entry.id}`}
                    />
                  </div>
                )}
              </div>
            </>
          )}
      </div>

      {/* Centered Modal Editor Dialog when a homework portion is selected */}
      {pickerTarget && (
        <InlineHomeworkEditor
          taskTitle={
            pickerTarget === 'hifz'
              ? 'Hifz'
              : pickerTarget === 'murajaa'
              ? 'Review'
              : pickerTarget === 'third'
              ? '3rd Task'
              : '4th Task'
          }
          initialText={
            pickerTarget === 'hifz'
              ? entry.hifzText
              : pickerTarget === 'murajaa'
              ? cleanMurajaa || entry.murajaaText || ''
              : pickerTarget === 'third'
              ? cleanThird || entry.thirdText || ''
              : cleanFourth || entry.fourthText || ''
          }
          grade={
            pickerTarget === 'hifz'
              ? entry.hifzGrade
              : pickerTarget === 'murajaa'
              ? entry.murajaaGrade
              : pickerTarget === 'third'
              ? entry.thirdGrade
              : entry.fourthGrade
          }
          onUpdateGrade={
            pickerTarget === 'hifz'
              ? handleHifzGradeChange
              : pickerTarget === 'murajaa'
              ? handleMurajaaGradeChange
              : pickerTarget === 'third'
              ? handleThirdGradeChange
              : handleFourthGradeChange
          }
          onSave={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
          studentSurahRatings={studentSurahRatings}
          onUpdateSurahStatus={onUpdateSurahStatus}
          isTeacherMode={isTeacherMode}
        />
      )}

      {/* On Time Slot */}
      {showOnTime && (
        <OnTimeBadge
          value={entry.onTimeScore}
          editable={isTeacherMode}
          onChange={(newScore) => onUpdateEntry({ ...entry, onTimeScore: newScore })}
          idPrefix={`ontime-${entry.id}`}
        />
      )}
    </div>
  );
});
