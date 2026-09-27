import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
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
  onOpenStudentNotes,
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
    hifzSurah && studentSurahRatings
      ? studentSurahRatings[hifzSurah.number] || 'not_memorized'
      : 'not_memorized';

  const murajaaSurah = getSurahFromHomework(cleanMurajaa || entry.murajaaText);
  const murajaaSurahStatus =
    murajaaSurah && studentSurahRatings
      ? studentSurahRatings[murajaaSurah.number] || 'not_memorized'
      : 'not_memorized';

  return (
    <div
      id={`entry-row-${entry.id}`}
      className={`flex items-stretch gap-1.5 sm:gap-2 w-full group transition-all duration-150 ${
        !isTeacherMode && isSingleMostRecentInView ? 'mb-9 sm:mb-10' : ''
      }`}
    >
      {/* Left Card: Date, compact, bold weekday, editable date in Teacher mode */}
      <div
        id={`date-card-${entry.id}`}
        className="relative w-10 sm:w-11 bg-white rounded-2xl flex flex-col items-center justify-center shrink-0 py-1 px-0.5 text-center transition-colors select-none"
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
        <span className="text-[10.5px] sm:text-[11.5px] font-sans font-extrabold text-[#1F2A3D] uppercase tracking-tight sm:tracking-normal leading-none pt-0.5">
          {weekday}
        </span>

        {/* Day of Month: Clickable to edit date in Teacher Mode */}
        {isTeacherMode ? (
          <div
            className="relative cursor-pointer group/date my-0.5"
            title="Click to change date"
          >
            <span className="text-base sm:text-lg font-sans font-extrabold text-[#0E5C56] group-hover/date:text-[#B8860B] leading-tight tabular-nums transition-colors block underline decoration-dotted decoration-[#B8860B]/60 underline-offset-2">
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
          <span className="text-base sm:text-lg font-sans font-extrabold text-[#0E5C56] leading-tight my-0.5 tabular-nums">
            {dayOfMonth}
          </span>
        )}

        {/* If this day was carried over from the previous month to complete this week */}
        {isDifferentMonth && (
          <span
            className="text-[8px] font-extrabold text-[#B8860B] bg-[#B8860B]/15 px-1 py-0.2 rounded-xs uppercase tracking-tighter"
            title={`Carried over from previous month (${entry.date}) to complete the week`}
          >
            {monthShort}
          </span>
        )}
      </div>

      {/* Right Card: Day's homework portions - tightened width & reduced max height ceiling (Req 5 & 6) */}
      <div
        id={`content-card-${entry.id}`}
        onClick={(e) => {
          // If click was on interactive buttons/inputs/pickers, don't open modal
          const target = e.target as HTMLElement;
          if (target.closest('button, input, select, textarea, [data-interactive="true"]')) {
            return;
          }
          onOpenStudentNotes?.();
        }}
        title={
          isTeacherMode
            ? 'Click blank space to edit focus notes & recitation'
            : 'Click to view memorization focus notes & recitation'
        }
        className={`flex-1 min-w-0 rounded-2xl sm:rounded-3xl py-1 px-2 sm:py-1 sm:px-2.5 flex flex-col justify-center relative transition-all ${cardBorder} hover:shadow-xs cursor-pointer max-h-[82px] sm:max-h-[86px] overflow-hidden`}
      >
        {/* Portion 1: Hifz Homework */}
        <div
          id={`hifz-row-${entry.id}`}
          className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[26px] sm:min-h-[28px]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-visible">
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
                className="text-[#1F2A3D] bg-transparent leading-tight focus:outline-none cursor-pointer truncate flex items-center justify-start gap-1.5 transition-opacity hover:opacity-75 text-left py-0.5"
                title="Click to select Surah & Ayahs"
              >
                {parsedHifz ? (
                  parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة' ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedHifz.surahName}
                      </span>
                      <span className="text-[#B8860B] font-bold text-sm sm:text-base shrink-0">
                        كاملة
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="text-[#B8860B] font-ayah font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                        {parsedHifz.ayahRange}
                      </span>
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedHifz.surahName}
                      </span>
                    </>
                  )
                ) : entry.hifzText ? (
                  <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                    {entry.hifzText.replace(/[()]/g, '').trim()}
                  </span>
                ) : (
                  <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm hover:text-[#0E5C56]">Click to select Surah...</span>
                )}
              </button>
            ) : (
              <div className="leading-tight flex items-center gap-1.5 whitespace-nowrap truncate">
                {parsedHifz ? (
                  parsedHifz.isFullSurah || parsedHifz.ayahRange === 'كاملة' ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedHifz.surahName}
                      </span>
                      <span className="text-[#B8860B] font-bold text-sm sm:text-base shrink-0">
                        كاملة
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="text-[#B8860B] font-ayah font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                        {parsedHifz.ayahRange}
                      </span>
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedHifz.surahName}
                      </span>
                    </>
                  )
                ) : entry.hifzText ? (
                  <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
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
          className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[26px] sm:min-h-[28px]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-visible">
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
                className="text-[#1F2A3D] bg-transparent leading-tight focus:outline-none cursor-pointer truncate flex items-center justify-start gap-1.5 transition-opacity hover:opacity-75 text-left py-0.5"
                title="Click to select Surah & Ayahs"
              >
                {parsedMurajaa ? (
                  parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة' ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedMurajaa.surahName}
                      </span>
                      <span className="text-[#B8860B] font-bold text-sm sm:text-base shrink-0">
                        كاملة
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="text-[#B8860B] font-ayah font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                        {parsedMurajaa.ayahRange}
                      </span>
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedMurajaa.surahName}
                      </span>
                    </>
                  )
                ) : cleanMurajaa ? (
                  <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                    {cleanMurajaa.replace(/[()]/g, '').trim()}
                  </span>
                ) : (
                  <span className="text-[#5B6478] italic font-normal text-xs sm:text-sm hover:text-[#0E5C56]">Click to select Surah...</span>
                )}
              </button>
            ) : (
              <div className="leading-tight flex items-center gap-1.5 whitespace-nowrap truncate">
                {parsedMurajaa ? (
                  parsedMurajaa.isFullSurah || parsedMurajaa.ayahRange === 'كاملة' ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedMurajaa.surahName}
                      </span>
                      <span className="text-[#B8860B] font-bold text-sm sm:text-base shrink-0">
                        كاملة
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="text-[#B8860B] font-ayah font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                        {parsedMurajaa.ayahRange}
                      </span>
                      <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
                        {parsedMurajaa.surahName}
                      </span>
                    </>
                  )
                ) : cleanMurajaa ? (
                  <span className="text-[#1F2A3D] font-medium text-base sm:text-lg truncate">
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

        {/* Student Mode: "Your Active Homework" badge - restyled to match WeeklyStarBand gold/amber style (Req 1) */}
        {!isTeacherMode && isSingleMostRecentInView && (
          <div
            id={`your-homework-badge-${entry.id}`}
            className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center select-none"
          >
            {/* Triangular pointer arrow seamlessly attached pointing directly up to the card above */}
            <div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-[#F8CB52] -mb-[0.5px]" />

            {/* Restyled badge matching WeeklyStarBand gold/amber style */}
            <div
              className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-5 py-1 sm:px-6 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-black tracking-wide border border-[#F8CB52]/70 shadow-[0_4px_16px_-4px_rgba(248,203,82,0.35)] backdrop-blur-[2px] text-[#8C6700] whitespace-nowrap"
              style={{
                background:
                  'linear-gradient(90deg, rgba(248, 203, 82, 0.5) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(248, 203, 82, 0.5) 100%)',
              }}
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8C6700] stroke-[2.5] shrink-0" />
              <span className="font-serif font-extrabold leading-tight select-none">Your Active Homework</span>
            </div>
          </div>
        )}
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
