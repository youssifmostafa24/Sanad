import React, { useState } from 'react';
import { Entry, GradeValue, SurahMemorizationStatus } from '../types';
import { getWeekdayShort, getDayOfMonth, parseLocalDate } from '../utils/dateUtils';
import { GradeBadge } from './GradeBadge';
import { OnTimeBadge } from './OnTimeBadge';
import { QuranAyahPickerModal } from './QuranAyahPickerModal';
import {
  normalizeQuranHomeworkText,
  parseQuranHomework,
  parseHomeworkDisplay,
  getSurahFromHomework,
} from '../data/quranSurahs';
import { SurahStatusDot } from './SurahStatusDot';

interface HomeworkRowProps {
  entry: Entry;
  isTeacherMode: boolean;
  isMostRecentUngraded: boolean;
  isSingleMostRecentInView: boolean;
  selectedMonthPrefix?: string;
  studentSurahRatings?: Record<number, SurahMemorizationStatus>;
  showOnTime?: boolean;
  isHighlighted?: boolean;
  onOpenStudentNotes?: () => void;
  onUpdateEntry: (updated: Entry) => void;
  onDeleteEntry: (entryId: string) => void;
  onDuplicateEntry: (entry: Entry) => void;
  onUpdateSurahStatus?: (surahNumber: number, status: SurahMemorizationStatus) => void;
}

export const HomeworkRow: React.FC<HomeworkRowProps> = ({
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
  onDuplicateEntry,
  onUpdateSurahStatus,
}) => {
  const weekday = getWeekdayShort(entry.date);
  const dayOfMonth = getDayOfMonth(entry.date);
  const isDifferentMonth = Boolean(selectedMonthPrefix && !entry.date.startsWith(selectedMonthPrefix));
  const monthShort = parseLocalDate(entry.date).toLocaleDateString('en-US', { month: 'short' });

  const cardBorder = 'bg-white';

  const [pickerTarget, setPickerTarget] = useState<'hifz' | 'murajaa' | null>(null);

  const handlePickerSelect = (formattedText: string) => {
    if (pickerTarget === 'hifz') {
      handleHifzTextChange(formattedText);
    } else if (pickerTarget === 'murajaa') {
      handleMurajaaTextChange(formattedText);
    }
    setPickerTarget(null);
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

  const handleDateChange = (newDate: string) => {
    if (newDate && newDate !== entry.date) {
      onUpdateEntry({ ...entry, date: newDate });
    }
  };

  // Find active surah rating for picker
  const activeText = pickerTarget === 'hifz' ? entry.hifzText : entry.murajaaText;
  const parsedTarget = parseQuranHomework(activeText);
  const targetSurahStatus =
    parsedTarget && studentSurahRatings
      ? studentSurahRatings[parsedTarget.surahNumber] || 'not_memorized'
      : 'not_memorized';

  const parsedHifz = parseHomeworkDisplay(entry.hifzText);
  const cleanMurajaa = entry.murajaaText ? entry.murajaaText.replace(/^(Review|ريفيو|حفظ)\s*:\s*/i, '') : '';
  const parsedMurajaa = parseHomeworkDisplay(cleanMurajaa);

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

  return (
    <div
      id={`entry-row-${entry.id}`}
      className={`flex items-stretch gap-1.5 sm:gap-2 w-full group transition-all duration-300 rounded-2xl ${
        isHighlighted
          ? 'ring-2 ring-[#B8860B] ring-offset-2 ring-offset-[#FBF6E8] scale-[1.01] shadow-md'
          : ''
      }`}
    >
      {/* Left Card: Date, compact, bold weekday, highlighted for latest homework entry */}
      <div
        id={`date-card-${entry.id}`}
        className={`relative w-10 sm:w-11 rounded-2xl flex flex-col items-center justify-center shrink-0 py-1 px-0.5 text-center transition-all select-none ${
          isSingleMostRecentInView
            ? 'bg-[#156E67] shadow-xs'
            : 'bg-white'
        }`}
      >
        {/* Teacher Mode: Delete "✕" */}
        {isTeacherMode && (
          <button
            id={`delete-btn-${entry.id}`}
            type="button"
            onClick={() => onDeleteEntry(entry.id)}
            title="Delete entry"
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white text-black border border-gray-300 flex items-center justify-center text-[10px] font-bold shadow-2xs hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
          >
            ✕
          </button>
        )}

        {/* Weekday - High contrast, clearly readable */}
        <span
          className={`text-[10.5px] sm:text-[11.5px] font-sans font-extrabold uppercase tracking-tight sm:tracking-normal leading-none pt-0.5 ${
            isSingleMostRecentInView ? 'text-white' : 'text-[#1F2A3D]'
          }`}
        >
          {weekday}
        </span>

        {/* Day of Month: Clickable to edit date in Teacher Mode */}
        {isTeacherMode ? (
          <div
            className="relative cursor-pointer group/date my-0.5"
            title="Click to change date"
          >
            <span
              className={`text-base sm:text-lg font-sans font-extrabold leading-tight tabular-nums transition-colors block underline decoration-dotted underline-offset-2 ${
                isSingleMostRecentInView
                  ? 'text-white group-hover/date:text-[#F8CB52] decoration-white/60'
                  : 'text-[#0E5C56] group-hover/date:text-[#B8860B] decoration-[#B8860B]/60'
              }`}
            >
              {dayOfMonth}
            </span>
            <input
              type="date"
              value={entry.date}
              onChange={(e) => handleDateChange(e.target.value)}
              onClick={(e) => {
                try {
                  (e.target as HTMLInputElement).showPicker?.();
                } catch {
                  // Fallback for browsers without showPicker
                }
              }}
              title="Click to edit date"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
          </div>
        ) : (
          <span
            className={`text-base sm:text-lg font-sans font-extrabold leading-tight my-0.5 tabular-nums ${
              isSingleMostRecentInView ? 'text-white' : 'text-[#0E5C56]'
            }`}
          >
            {dayOfMonth}
          </span>
        )}

        {/* If this day was carried over from the previous month to complete this week */}
        {isDifferentMonth && (
          <span
            className={`text-[8px] font-extrabold px-1 py-0.2 rounded-xs uppercase tracking-tighter ${
              isSingleMostRecentInView
                ? 'text-white bg-white/20'
                : 'text-[#B8860B] bg-[#B8860B]/15'
            }`}
            title={`Carried over from previous month (${entry.date}) to complete the week`}
          >
            {monthShort}
          </span>
        )}
      </div>

      {/* Right Card: Day's homework portions */}
      <div
        id={`content-card-${entry.id}`}
        className={`flex-1 min-w-0 rounded-2xl sm:rounded-3xl py-1 px-2 sm:py-1 sm:px-2.5 flex flex-col justify-center relative transition-all ${cardBorder} min-h-[68px] sm:min-h-[72px] overflow-hidden`}
      >
        {/* Portion 1: Hifz Homework */}
        <div
          id={`hifz-row-${entry.id}`}
          className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-visible">
            {/* Surah Status Dot placed to the left beside the numbers */}
            {hifzSurah && (
              <SurahStatusDot
                surah={hifzSurah}
                status={hifzSurahStatus}
                isTeacherMode={isTeacherMode}
                onUpdateStatus={onUpdateSurahStatus}
                idPrefix={`hifz-dot-${entry.id}`}
              />
            )}

            {isTeacherMode ? (
              <button
                id={`hifz-input-${entry.id}`}
                type="button"
                onClick={() => setPickerTarget('hifz')}
                className="text-[#1F2A3D] bg-transparent leading-tight focus:outline-none cursor-pointer truncate flex items-center justify-start gap-2 transition-opacity hover:opacity-75 text-left py-0.5"
                title="Click to select Surah & Ayahs"
              >
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
                  <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm hover:text-[#0E5C56]">Click to select Surah...</span>
                )}
              </button>
            ) : (
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
            )}
          </div>

          <div className="shrink-0 flex items-center justify-end">
            <GradeBadge
              grade={entry.hifzGrade}
              editable={isTeacherMode}
              onChange={handleHifzGradeChange}
              idPrefix={`hifz-${entry.id}`}
            />
          </div>
        </div>

        {/* Dashed line separating homework 1 and homework 2 */}
        <div
          className="w-full border-t border-dashed border-[#B8860B]/20 sm:border-[#B8860B]/25 my-0.5 sm:my-1 shrink-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Portion 2: Murajaa Homework */}
        <div
          id={`murajaa-row-${entry.id}`}
          className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[30px]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-visible">
            {/* Surah Status Dot placed to the left beside the numbers */}
            {murajaaSurah && (
              <SurahStatusDot
                surah={murajaaSurah}
                status={murajaaSurahStatus}
                isTeacherMode={isTeacherMode}
                onUpdateStatus={onUpdateSurahStatus}
                idPrefix={`murajaa-dot-${entry.id}`}
              />
            )}

            {isTeacherMode ? (
              <button
                id={`murajaa-input-${entry.id}`}
                type="button"
                onClick={() => setPickerTarget('murajaa')}
                className="text-[#1F2A3D] bg-transparent leading-tight focus:outline-none cursor-pointer truncate flex items-center justify-start gap-2 transition-opacity hover:opacity-75 text-left py-0.5"
                title="Click to select Surah & Ayahs"
              >
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
                  <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm hover:text-[#0E5C56]">Click to select Surah...</span>
                )}
              </button>
            ) : (
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
            )}
          </div>

          <div className="shrink-0 flex items-center justify-end">
            <GradeBadge
              grade={entry.murajaaGrade}
              editable={isTeacherMode}
              onChange={handleMurajaaGradeChange}
              idPrefix={`murajaa-${entry.id}`}
            />
          </div>
        </div>
      </div>

      {/* On Time Slot */}
      {showOnTime && (
        <OnTimeBadge
          value={entry.onTimeScore}
          editable={isTeacherMode}
          onChange={(newScore) => onUpdateEntry({ ...entry, onTimeScore: newScore })}
          idPrefix={`ontime-${entry.id}`}
        />
      )}

      {isTeacherMode && (
        <QuranAyahPickerModal
          isOpen={pickerTarget !== null}
          onClose={() => setPickerTarget(null)}
          onSelect={handlePickerSelect}
          title={pickerTarget === 'hifz' ? 'Edit Memorization (Hifz)' : 'Edit Review (Murajaah)'}
          initialText={pickerTarget === 'hifz' ? entry.hifzText : entry.murajaaText}
          currentSurahStatus={targetSurahStatus}
          onUpdateSurahStatus={onUpdateSurahStatus}
        />
      )}
    </div>
  );
};
