import React, { useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Entry } from '../types';
import { formatLocalDate } from '../utils/dateUtils';

interface MonthNavigatorProps {
  isCurrent: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;
  monthLabel?: string;
  entries?: Entry[];
  activeEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  isCurrent,
  onPrevMonth,
  onNextMonth,
  onGoToCurrentMonth,
  monthLabel,
  entries = [],
  activeEntryId,
  onSelectEntry,
}) => {
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the timeline row so the active day stays centered/visible
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeEntryId, entries.length]);

  const todayStr = formatLocalDate(new Date());

  // Determine dot color based on homework status
  const getDotColor = (entry: Entry): string => {
    if (entry.date > todayStr) {
      return 'bg-[#D8CBB2]'; // Beige / muted dot for future dates
    }
    const hasHifz = entry.hifzGrade !== null && entry.hifzGrade !== undefined;
    const hasMurajaa = entry.murajaaGrade !== null && entry.murajaaGrade !== undefined;

    if (hasHifz && hasMurajaa) {
      if (entry.hifzGrade >= 85 && entry.murajaaGrade >= 85) {
        return 'bg-[#34A853]'; // Green dot for completed / high performance
      }
      return 'bg-[#E5A93C]'; // Amber dot if needs attention
    }
    // Pending / ungraded portion
    return 'bg-[#E5A93C]'; // Amber / orange dot
  };

  return (
    <div
      id="month-navigator-bar"
      dir="ltr"
      className="w-full rounded-3xl bg-white p-3.5 sm:p-4.5 select-none transition-all shadow-xs"
    >
      {/* Top Header: Previous Button (<), Month & Year, Next Button (>) */}
      <div className="flex items-center justify-between gap-3 px-1 sm:px-2">
        {/* Previous Month (<) */}
        <button
          id="prev-month-btn"
          type="button"
          onClick={onPrevMonth}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F5EFDD] hover:bg-[#EADBBD] text-[#0E5C56] flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
          title="Previous month"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-[#0E5C56]" strokeWidth={2.6} />
        </button>

        {/* Month & Year Title */}
        <button
          id="current-month-btn"
          type="button"
          onClick={onGoToCurrentMonth}
          className="font-sans font-extrabold text-xl sm:text-2xl text-[#0E5C56] tracking-tight hover:opacity-80 transition-opacity cursor-pointer text-center truncate"
          title={isCurrent ? 'Current month' : 'Click to go to current month'}
        >
          {monthLabel || 'October 2026'}
        </button>

        {/* Next Month (>) */}
        <button
          id="next-month-btn"
          type="button"
          onClick={onNextMonth}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F5EFDD] hover:bg-[#EADBBD] text-[#0E5C56] flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
          title="Next month"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-[#0E5C56]" strokeWidth={2.6} />
        </button>
      </div>

      {/* Bottom Timeline: Horizontal Days with Status Dots */}
      {entries.length > 0 ? (
        <div
          ref={scrollContainerRef}
          className="mt-3.5 sm:mt-4 flex items-center justify-start sm:justify-center gap-2 sm:gap-3.5 overflow-x-auto py-1.5 px-2 scroll-smooth no-scrollbar"
        >
          {entries.map((entry) => {
            const isActive = activeEntryId === entry.id;
            const dotColor = getDotColor(entry);
            const dayNum = parseInt(entry.date.split('-')[2], 10);
            const isFuture = entry.date > todayStr;

            if (isActive) {
              return (
                <button
                  key={`day-btn-${entry.id}`}
                  ref={activeBtnRef}
                  id={`day-nav-${entry.id}`}
                  type="button"
                  onClick={() => onSelectEntry?.(entry.id)}
                  className="relative flex flex-col items-center justify-center bg-[#0E5C56] text-white rounded-2xl py-2 px-2.5 min-w-[42px] sm:min-w-[46px] h-[54px] sm:h-[58px] shadow-sm shrink-0 transition-transform active:scale-95 cursor-pointer"
                  title={`يوم ${dayNum} - الواجب المحدد`}
                >
                  {/* Status Dot */}
                  <span className={`w-2 h-2 rounded-full mb-1.5 shrink-0 ${dotColor}`} />
                  {/* Day Number */}
                  <span className="font-extrabold text-sm sm:text-base leading-none text-white tabular-nums">
                    {dayNum}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={`day-btn-${entry.id}`}
                id={`day-nav-${entry.id}`}
                type="button"
                onClick={() => onSelectEntry?.(entry.id)}
                className="flex flex-col items-center justify-center py-2 px-2 min-w-[36px] sm:min-w-[40px] h-[54px] sm:h-[58px] rounded-xl hover:bg-[#F5EFDD]/70 transition-colors shrink-0 cursor-pointer text-center"
                title={`يوم ${dayNum}`}
              >
                {/* Status Dot */}
                <span className={`w-2 h-2 rounded-full mb-2 shrink-0 ${dotColor}`} />
                {/* Day Number */}
                <span
                  className={`font-bold text-xs sm:text-sm leading-none tabular-nums ${
                    isFuture ? 'text-[#8A94A6]' : 'text-[#4A5568]'
                  }`}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 text-center text-xs text-[#7A8699] py-1">
          No homework entries for this month
        </div>
      )}
    </div>
  );
};

export const WeekNavigator = MonthNavigator;
