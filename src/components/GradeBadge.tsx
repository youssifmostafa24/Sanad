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
          className={`h-[22px] sm:h-[26px] md:h-[30px] text-[10px] sm:text-[11px] md:text-xs font-bold pl-1.5 sm:pl-2.5 md:pl-3 pr-4 sm:pr-5 md:pr-6 text-left rounded-full transition-all cursor-pointer outline-none border focus:ring-1 focus:ring-[#B8860B]/40 appearance-none shadow-2xs ${
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
            backgroundPosition: 'right 0.25rem center',
            backgroundSize: '0.65em',
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
        className={`h-[22px] sm:h-[26px] md:h-[30px] px-2 sm:px-2.5 md:px-3.5 shrink-0 inline-flex items-center justify-center rounded-full bg-[#F4F5F7] text-[#5B6478] border border-gray-200 text-[10px] sm:text-[11px] md:text-xs font-bold select-none whitespace-nowrap ${className}`}
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
      className={`h-[22px] sm:h-[26px] md:h-[30px] px-1.5 sm:px-2.5 md:px-3.5 shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-[10px] sm:text-[11px] md:text-xs font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none ${className}`}
    >
      <span className="text-[9px] sm:text-[10px] md:text-[11px] leading-none">{style.icon}</span>
      <span className="tabular-nums font-sans leading-none">{style.score}</span>
    </span>
  );
};
