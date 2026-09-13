import React, { useState } from 'react';
import { Entry, GradeValue, SurahMemorizationStatus } from '../types';
import { getWeekdayShort, getDayOfMonth, parseLocalDate } from '../utils/dateUtils';
import { GradeBadge } from './GradeBadge';
import { QuranAyahPickerModal } from './QuranAyahPickerModal';
import { normalizeQuranHomeworkText, parseQuranHomework, parseHomeworkDisplay } from '../data/quranSurahs';

interface HomeworkRowProps {
  entry: Entry;
  isTeacherMode: boolean;
  isMostRecentUngraded: boolean;
  isSingleMostRecentInView: boolean;
  selectedMonthPrefix?: string;
  studentSurahRatings?: Record<number, SurahMemorizationStatus>;
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
  onUpdateEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onUpdateSurahStatus,
}) => {
  const weekday = getWeekdayShort(entry.date);
  const dayOfMonth = getDayOfMonth(entry.date);
  const isDifferentMonth = Boolean(selectedMonthPrefix && !entry.date.startsWith(selectedMonthPrefix));
  const monthShort = parseLocalDate(entry.date).toLocaleDateString('en-US', { month: 'short' });

  const cardBorder = isMostRecentUngraded
    ? 'bg-[#E9F8E7] border-[#0E5C56]/20'
    : 'bg-[#FBF6E8] border-[#B8860B]/10';

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

  return (
    <div
      id={`entry-row-${entry.id}`}
      className="flex items-stretch space-x-1.5 sm:space-x-2 w-full group transition-all duration-150"
    >
      {/* Left Card: Date, compact, bold weekday, editable date in Teacher mode */}
      <div
        id={`date-card-${entry.id}`}
        className="relative w-10 sm:w-11 bg-[#FBF6E8] rounded-xl shadow-2xs flex flex-col items-center justify-center border border-[#B8860B]/15 shrink-0 py-1 px-0.5 text-center transition-colors select-none"
      >
        {/* Teacher Mode: Delete "✕" */}
        {isTeacherMode && (
          <button
            id={`delete-btn-${entry.id}`}
            type="button"
            onClick={() => onDeleteEntry(entry.id)}
            title="حذف الواجب"
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white text-black border border-gray-300 flex items-center justify-center text-[10px] font-bold shadow-2xs hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
          >
            ✕
          </button>
        )}

        {/* Weekday - Bold as requested */}
        <span className="text-[9px] sm:text-[9.5px] font-sans font-bold text-[#5B6478] uppercase tracking-wider leading-none">
          {weekday}
        </span>

        {/* Day of Month: Clickable to edit date in Teacher Mode */}
        {isTeacherMode ? (
          <div
            className="relative cursor-pointer group/date my-0.5"
            title="اضغط على الرقم لتعديل التاريخ"
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
              title="اضغط لتعديل تاريخ هذا اليوم"
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
            title={`تاريخ منقول من الشهر السابق (${entry.date}) ليكتمل أسبوع هذا الشهر`}
          >
            {monthShort}
          </span>
        )}
      </div>

      {/* Right Card: Day's two homework portions - Compact vertical thickness */}
      <div
        id={`content-card-${entry.id}`}
        className={`flex-1 min-w-0 rounded-xl shadow-2xs py-1 px-2 sm:py-1.5 sm:px-2.5 flex flex-col justify-center border relative overflow-hidden transition-colors ${cardBorder}`}
      >
        {/* "New home work" pill: Top-Center, hidden when tight or on mobile overflow */}
        {isMostRecentUngraded && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-[#0E5C56] text-[#F1E7CE] text-[8px] sm:text-[8.5px] font-bold uppercase rounded-b-md shadow-2xs z-10 pointer-events-none max-w-[110px] truncate hidden sm:inline-block">
            New home work
          </div>
        )}

        {/* Portion 1: Hifz Homework */}
        {(() => {
          const parsedHifz = parseHomeworkDisplay(entry.hifzText);
          return (
            <div
              id={`hifz-row-${entry.id}`}
              className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full items-center min-h-[30px]"
            >
              {/* Homework content: Ayah range on the left (towards date), Surah on the right of ayah range */}
              <div className="w-full min-w-0">
                {isTeacherMode ? (
                  <button
                    id={`hifz-input-${entry.id}`}
                    type="button"
                    onClick={() => setPickerTarget('hifz')}
                    className="w-full h-[30px] text-[#1F2A3D] bg-transparent border border-[#B8860B]/30 hover:border-[#0E5C56]/40 rounded-lg py-0.5 px-2 leading-tight focus:outline-none focus:ring-1 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs truncate flex items-center justify-start gap-1.5 transition-colors text-left"
                    title="اضغط لاختيار السورة والآيات"
                  >
                    {parsedHifz ? (
                      <>
                        <span className="text-[#0E5C56] font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                          {parsedHifz.ayahRange}
                        </span>
                        <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg truncate">
                          {parsedHifz.surahName}
                        </span>
                      </>
                    ) : entry.hifzText ? (
                      <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg truncate">{entry.hifzText}</span>
                    ) : (
                      <span className="text-[#5B6478] italic font-normal text-[11px]">اضغط لاختيار السورة...</span>
                    )}
                  </button>
                ) : (
                  <div className="leading-tight flex items-center gap-1.5 flex-wrap">
                    {parsedHifz ? (
                      <>
                        <span className="text-[#0E5C56] font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                          {parsedHifz.ayahRange}
                        </span>
                        <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg">
                          {parsedHifz.surahName}
                        </span>
                      </>
                    ) : entry.hifzText ? (
                      <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg break-words">{entry.hifzText}</span>
                    ) : (
                      <span className="text-[#5B6478] italic text-xs font-normal">None assigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* GradeBadge: directly beside the homework, parallel and identical in width */}
              <div className="w-full min-w-0 flex items-center justify-end">
                <GradeBadge
                  grade={entry.hifzGrade}
                  editable={isTeacherMode}
                  onChange={handleHifzGradeChange}
                  idPrefix={`hifz-${entry.id}`}
                  className="w-full"
                />
              </div>
            </div>
          );
        })()}

        {/* Portion 2: Murajaa Homework (no divider between portions) */}
        {(() => {
          const cleanMurajaa = entry.murajaaText ? entry.murajaaText.replace(/^(Review|ريفيو|حفظ)\s*:\s*/i, '') : '';
          const parsedMurajaa = parseHomeworkDisplay(cleanMurajaa);
          return (
            <div
              id={`murajaa-row-${entry.id}`}
              className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full items-center min-h-[30px] mt-1 sm:mt-1.5"
            >
              {/* Homework content: Ayah range on the left (towards date), Surah on the right of ayah range */}
              <div className="w-full min-w-0">
                {isTeacherMode ? (
                  <button
                    id={`murajaa-input-${entry.id}`}
                    type="button"
                    onClick={() => setPickerTarget('murajaa')}
                    className="w-full h-[30px] text-[#1F2A3D] bg-transparent border border-[#B8860B]/30 hover:border-[#0E5C56]/40 rounded-lg py-0.5 px-2 leading-tight focus:outline-none focus:ring-1 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs truncate flex items-center justify-start gap-1.5 transition-colors text-left"
                    title="اضغط لاختيار السورة والآيات"
                  >
                    {parsedMurajaa ? (
                      <>
                        <span className="text-[#0E5C56] font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                          {parsedMurajaa.ayahRange}
                        </span>
                        <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg truncate">
                          {parsedMurajaa.surahName}
                        </span>
                      </>
                    ) : cleanMurajaa ? (
                      <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg truncate">{cleanMurajaa}</span>
                    ) : (
                      <span className="text-[#5B6478] italic font-normal text-[11px]">اضغط لاختيار السورة...</span>
                    )}
                  </button>
                ) : (
                  <div className="leading-tight flex items-center gap-1.5 flex-wrap">
                    {parsedMurajaa ? (
                      <>
                        <span className="text-[#0E5C56] font-extrabold text-base sm:text-lg tabular-nums shrink-0" dir="ltr">
                          {parsedMurajaa.ayahRange}
                        </span>
                        <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg">
                          {parsedMurajaa.surahName}
                        </span>
                      </>
                    ) : cleanMurajaa ? (
                      <span className="text-[#1F2A3D] font-extrabold text-base sm:text-lg break-words">{cleanMurajaa}</span>
                    ) : (
                      <span className="text-[#5B6478] italic text-xs font-normal">None assigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* GradeBadge: directly beside the homework, parallel and identical in width */}
              <div className="w-full min-w-0 flex items-center justify-end">
                <GradeBadge
                  grade={entry.murajaaGrade}
                  editable={isTeacherMode}
                  onChange={handleMurajaaGradeChange}
                  idPrefix={`murajaa-${entry.id}`}
                  className="w-full"
                />
              </div>
            </div>
          );
        })()}
      </div>

      {isTeacherMode && (
        <QuranAyahPickerModal
          isOpen={pickerTarget !== null}
          onClose={() => setPickerTarget(null)}
          onSelect={handlePickerSelect}
          title={pickerTarget === 'hifz' ? 'تعديل واجب الحفظ (1)' : 'تعديل واجب المراجعة (2)'}
          initialText={pickerTarget === 'hifz' ? entry.hifzText : entry.murajaaText}
          currentSurahStatus={targetSurahStatus}
          onUpdateSurahStatus={onUpdateSurahStatus}
        />
      )}
    </div>
  );
};
