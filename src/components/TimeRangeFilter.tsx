import React from 'react';
import { TimeRange } from '../types';

interface TimeRangeFilterProps {
  currentRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ currentRange, onChange }) => {
  const options: { id: TimeRange; label: string }[] = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <div
      id="time-range-filter"
      className="flex bg-[#FBF6E8] p-1 rounded-full shadow-inner border border-[#B8860B]/15 self-center"
    >
      {options.map((opt) => {
        const isActive = currentRange === opt.id;
        return (
          <button
            key={opt.id}
            id={`filter-btn-${opt.id}`}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#B8860B] text-white shadow-md'
                : 'text-[#5B6478] hover:text-[#0E5C56]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
