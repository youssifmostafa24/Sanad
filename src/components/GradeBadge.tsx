import React from 'react';
import { GradeValue } from '../types';

interface GradeBadgeProps {
  grade: GradeValue | null;
  editable?: boolean;
  onChange?: (grade: GradeValue | null) => void;
  idPrefix?: string;
  className?: string;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  editable = false,
  onChange,
  idPrefix = 'grade-badge',
  className = '',
}) => {
  if (editable && onChange) {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`} id={`${idPrefix}-select-container`} dir="ltr">
        <select
          id={`${idPrefix}-select`}
          value={grade === null ? '' : String(grade)}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : (Number(val) as GradeValue));
          }}
          className={`h-[26px] sm:h-[30px] md:h-[34px] text-xs sm:text-[13px] md:text-sm font-bold pl-2 sm:pl-3 md:pl-3.5 pr-5 sm:pr-6 md:pr-7 text-left rounded-full transition-all cursor-pointer outline-none border focus:ring-1 focus:ring-[#B8860B]/40 appearance-none shadow-2xs ${
            grade === null
              ? 'bg-[#F4F5F7] text-[#5B6478] border-gray-200'
              : grade === 100
              ? 'bg-[#E2F7EB] text-[#0E5C56] border-[#A3E6C3]'
              : grade === 80
              ? 'bg-[#EAF6EE] text-[#166534] border-[#BBF7D0]'
              : grade === 60
              ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
              : grade === 40
              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
              : 'bg-[#EF4444]/20 text-[#7F1D1D] border-[#EF4444]/40'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235B6478'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.35rem center',
            backgroundSize: '0.7em',
          }}
        >
          <option value="">—</option>
          <option value="100">✅✅ 100</option>
          <option value="80">✅ 80</option>
          <option value="60">🟨 60</option>
          <option value="40">❌ 40</option>
          <option value="20">❌❌ 20</option>
        </select>
      </div>
    );
  }

  // Read-only view (Student Mode)
  if (grade === null) {
    return (
      <span
        id={`${idPrefix}-pending`}
        dir="ltr"
        className={`h-[26px] sm:h-[30px] md:h-[34px] px-2.5 sm:px-3 md:px-4 shrink-0 inline-flex items-center justify-center rounded-full bg-[#F4F5F7] text-[#5B6478] border border-gray-200 text-xs sm:text-[13px] md:text-sm font-bold select-none whitespace-nowrap ${className}`}
        title="قيد الانتظار"
      >
        —
      </span>
    );
  }

  const getBadgeStyle = (val: GradeValue) => {
    switch (val) {
      case 100:
        return {
          bg: 'bg-[#E2F7EB]',
          text: 'text-[#0E5C56]',
          border: 'border-[#A3E6C3]',
          icon: '✅✅',
          score: 100,
        };
      case 80:
        return {
          bg: 'bg-[#EAF6EE]',
          text: 'text-[#166534]',
          border: 'border-[#BBF7D0]',
          icon: '✅',
          score: 80,
        };
      case 60:
        return {
          bg: 'bg-[#FEF9C3]',
          text: 'text-[#854D0E]',
          border: 'border-[#FDE047]',
          icon: '🟨',
          score: 60,
        };
      case 40:
        return {
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
          border: 'border-[#FCA5A5]',
          icon: '❌',
          score: 40,
        };
      case 20:
        return {
          bg: 'bg-[#EF4444]/20',
          text: 'text-[#7F1D1D]',
          border: 'border-[#EF4444]/40',
          icon: '❌❌',
          score: 20,
        };
    }
  };

  const style = getBadgeStyle(grade);

  return (
    <span
      id={`${idPrefix}-val`}
      dir="ltr"
      title={String(style.score)}
      className={`h-[26px] sm:h-[30px] md:h-[34px] px-2.5 sm:px-3 md:px-4 shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-xs sm:text-[13px] md:text-sm font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none ${className}`}
    >
      <span className="text-[10px] sm:text-[11.5px] md:text-xs leading-none">{style.icon}</span>
      <span className="tabular-nums font-sans leading-none">{style.score}</span>
    </span>
  );
};
