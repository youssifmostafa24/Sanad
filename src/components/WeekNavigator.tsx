import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface MonthNavigatorProps {
  isCurrent: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;
  monthLabel?: string;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  isCurrent,
  onPrevMonth,
  onNextMonth,
  onGoToCurrentMonth,
  monthLabel,
}) => {
  return (
    <div
      id="month-navigator-bar"
      className="w-full rounded-xl bg-white/95 border border-[#B8860B]/25 p-1 sm:p-1.5 shadow-2xs flex items-center justify-between gap-1 sm:gap-2 select-none"
    >
      {/* Previous month */}
      <button
        id="prev-month-btn"
        type="button"
        onClick={onPrevMonth}
        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg bg-[#FBF6E8] hover:bg-[#F6ECD2] border border-[#B8860B]/25 text-[#0E5C56] hover:text-[#0A423E] text-[10px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap"
        title="Previous month"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
        <span>Previous month</span>
      </button>

      {/* Current month */}
      <button
        id="current-month-btn"
        type="button"
        onClick={onGoToCurrentMonth}
        className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${
          isCurrent
            ? 'bg-[#0E5C56] text-[#F1E7CE] border border-[#0E5C56]'
            : 'bg-[#FBF6E8] hover:bg-[#F6ECD2] border border-[#B8860B]/25 text-[#8A6305] hover:text-[#0E5C56]'
        }`}
        title={monthLabel ? `Current month (${monthLabel})` : 'Current month'}
      >
        <span>Current month</span>
      </button>

      {/* Next month */}
      <button
        id="next-month-btn"
        type="button"
        onClick={onNextMonth}
        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg bg-[#FBF6E8] hover:bg-[#F6ECD2] border border-[#B8860B]/25 text-[#0E5C56] hover:text-[#0A423E] text-[10px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap"
        title="Next month"
      >
        <span>Next month</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
      </button>
    </div>
  );
};

export const WeekNavigator = MonthNavigator;


