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
      <div className={`relative inline-block ${className || 'w-[82px] shrink-0'}`} id={`${idPrefix}-select-container`} dir="ltr">
        <select
          id={`${idPrefix}-select`}
          value={grade === null ? '' : String(grade)}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : (Number(val) as GradeValue));
          }}
          className={`w-full h-[30px] text-[11px] font-bold pl-2.5 pr-5 text-left rounded-lg transition-all cursor-pointer outline-none border focus:ring-1 focus:ring-[#B8860B]/40 appearance-none shadow-2xs ${
            grade === null
              ? 'bg-[#FBF6E8] text-[#5B6478] border-[#B8860B]/20'
              : grade === 100
              ? 'bg-[#16A34A]/25 text-[#15803D] border-[#16A34A]/40'
              : grade === 80
              ? 'bg-[#16A34A]/12 text-[#166534] border-[#16A34A]/25'
              : grade === 60
              ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
              : grade === 40
              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
              : 'bg-[#EF4444]/28 text-[#7F1D1D] border-[#EF4444]/50'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235B6478'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.25rem center',
            backgroundSize: '0.75em',
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
        className={`${className || 'w-[82px] shrink-0'} h-[30px] inline-flex items-center justify-start pl-2.5 pr-2 rounded-lg bg-[#FBF6E8]/70 text-[#5B6478] border border-[#B8860B]/20 text-[11px] font-bold select-none whitespace-nowrap text-left`}
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
          bg: 'bg-[#16A34A]/25',
          text: 'text-[#15803D]',
          border: 'border-[#16A34A]/40',
          icon: '✅✅',
          score: 100,
        };
      case 80:
        return {
          bg: 'bg-[#16A34A]/12',
          text: 'text-[#166534]',
          border: 'border-[#16A34A]/25',
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
          bg: 'bg-[#EF4444]/28',
          text: 'text-[#7F1D1D]',
          border: 'border-[#EF4444]/50',
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
      className={`${className || 'w-[82px] shrink-0'} h-[30px] inline-flex items-center justify-start pl-2.5 pr-2 gap-1.5 rounded-lg text-[11px] font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none text-left`}
    >
      <span className="text-[11px] leading-none">{style.icon}</span>
      <span className="tabular-nums font-sans leading-none">{style.score}</span>
    </span>
  );
};
