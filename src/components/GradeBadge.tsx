import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { GradeValue } from '../types';
import { CustomSelectDropdown, DropdownOption } from './CustomSelectDropdown';

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
  const [showInfo, setShowInfo] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close info popover on click outside or Escape
  useEffect(() => {
    if (!showInfo) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInfo(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInfo]);

  const getBadgeStyle = (val: GradeValue | null) => {
    if (val === null) {
      return {
        bg: 'bg-[#F4F5F7]',
        text: 'text-[#5B6478]',
        border: 'border-gray-200',
        icon: '—',
        score: '—',
        label: 'قيد التقييم',
      };
    }
    switch (val) {
      case 100:
        return {
          bg: 'bg-[#E2F7EB]',
          text: 'text-[#0E5C56]',
          border: 'border-[#A3E6C3]',
          icon: '✅✅',
          score: 100,
          label: 'ممتاز جداً (متقن بدون أخطاء)',
        };
      case 80:
        return {
          bg: 'bg-[#EAF6EE]',
          text: 'text-[#166534]',
          border: 'border-[#BBF7D0]',
          icon: '✅',
          score: 80,
          label: 'جيد جداً (خطأ أو تنبيه خفيف)',
        };
      case 60:
        return {
          bg: 'bg-[#FEF9C3]',
          text: 'text-[#854D0E]',
          border: 'border-[#FDE047]',
          icon: '🟨',
          score: 60,
          label: 'جيد (يحتاج تثبيت ومراجعة)',
        };
      case 40:
        return {
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
          border: 'border-[#FCA5A5]',
          icon: '❌',
          score: 40,
          label: 'يحتاج إعادة تسميع',
        };
      case 20:
        return {
          bg: 'bg-[#EF4444]/20',
          text: 'text-[#7F1D1D]',
          border: 'border-[#EF4444]/40',
          icon: '❌❌',
          score: 20,
          label: 'إعادة وتثبيت كامل',
        };
    }
  };

  const style = getBadgeStyle(grade);

  const gradeOptions: DropdownOption<GradeValue | null>[] = [
    {
      value: null,
      label: 'بدون تقييم',
      badgeContent: '—',
      badgeStyle: 'bg-[#F4F5F7] text-[#5B6478] border-gray-200',
    },
    {
      value: 100,
      label: '100 (ممتاز جداً)',
      badgeContent: (
        <span className="flex items-center gap-1 font-sans">
          <span>✅✅</span>
          <span>100</span>
        </span>
      ),
      badgeStyle: 'bg-[#E2F7EB] text-[#0E5C56] border-[#A3E6C3]',
    },
    {
      value: 80,
      label: '80 (جيد جداً)',
      badgeContent: (
        <span className="flex items-center gap-1 font-sans">
          <span>✅</span>
          <span>80</span>
        </span>
      ),
      badgeStyle: 'bg-[#EAF6EE] text-[#166534] border-[#BBF7D0]',
    },
    {
      value: 60,
      label: '60 (جيد)',
      badgeContent: (
        <span className="flex items-center gap-1 font-sans">
          <span>🟨</span>
          <span>60</span>
        </span>
      ),
      badgeStyle: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]',
    },
    {
      value: 40,
      label: '40 (يحتاج مراجعة)',
      badgeContent: (
        <span className="flex items-center gap-1 font-sans">
          <span>❌</span>
          <span>40</span>
        </span>
      ),
      badgeStyle: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
    },
    {
      value: 20,
      label: '20 (إعادة وتثبيت)',
      badgeContent: (
        <span className="flex items-center gap-1 font-sans">
          <span>❌❌</span>
          <span>20</span>
        </span>
      ),
      badgeStyle: 'bg-[#EF4444]/20 text-[#7F1D1D] border-[#EF4444]/40',
    },
  ];

  // In Editable (Teacher) Mode: matches exact size, padding, and proportions of student mode badge
  if (editable && onChange) {
    return (
      <div
        className={`relative inline-flex items-center shrink-0 min-w-[38px] min-h-[38px] justify-center ${className}`}
        id={`${idPrefix}-select-container`}
        dir="ltr"
      >
        <button
          ref={triggerRef}
          type="button"
          id={`${idPrefix}-trigger`}
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen((prev) => !prev);
          }}
          className={`h-[26px] sm:h-[30px] md:h-[34px] px-2.5 sm:px-3 md:px-3.5 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-xs sm:text-[13px] md:text-sm font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none cursor-pointer active:scale-95 transition-transform`}
          title="اضغط لتغيير درجة التقييم"
          aria-label="تحديد درجة التقييم"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <span className="text-[10px] sm:text-[11.5px] md:text-xs leading-none">{style.icon}</span>
          <span className="tabular-nums font-sans leading-none">{style.score}</span>
        </button>

        <CustomSelectDropdown<GradeValue | null>
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          triggerRef={triggerRef}
          selectedValue={grade}
          onSelect={(newGrade) => {
            onChange(newGrade);
          }}
          title="تحديد درجة التقييم"
          width={250}
          align="right"
          dir="rtl"
          idPrefix={idPrefix}
          options={gradeOptions}
        />
      </div>
    );
  }

  // Priority 2.3 & 3.4: In Student Mode: tap to show explanation sheet on touch devices
  return (
    <div ref={containerRef} className={`relative inline-flex items-center shrink-0 min-w-[38px] min-h-[38px] justify-center ${className}`}>
      <button
        type="button"
        id={`${idPrefix}-val`}
        onClick={(e) => {
          e.stopPropagation();
          setShowInfo((prev) => !prev);
        }}
        dir="ltr"
        className={`h-[26px] sm:h-[30px] md:h-[34px] px-2.5 sm:px-3 md:px-3.5 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-xs sm:text-[13px] md:text-sm font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none cursor-pointer active:scale-95 transition-transform`}
        title={`التقييم: ${style.score} (${style.label}) - اضغط للتفاصيل`}
        aria-label={`التقييم: ${style.score}`}
      >
        <span className="text-[10px] sm:text-[11.5px] md:text-xs leading-none">{style.icon}</span>
        <span className="tabular-nums font-sans leading-none">{style.score}</span>
      </button>

      {/* Tap Explanation Popover for Students (Priority 2.3) */}
      {showInfo && (
        <div
          id={`${idPrefix}-info-popover`}
          className="absolute top-full mt-2 left-0 z-50 w-52 bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-xl border border-[#B8860B]/35 p-3 text-right font-sans select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#B8860B]/20">
            <span className="text-xs font-bold text-[#0E5C56]">دليل درجات التقييم</span>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 p-1 rounded-lg bg-[#E2F7EB] text-[#0E5C56] font-bold">
              <span>✅✅ 100</span>
              <span className="text-[10px] font-normal">ممتاز ومتقن</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-[#EAF6EE] text-[#166534] font-bold">
              <span>✅ 80</span>
              <span className="text-[10px] font-normal">جيد جداً</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-[#FEF9C3] text-[#854D0E] font-bold">
              <span>🟨 60</span>
              <span className="text-[10px] font-normal">جيد (مراجعة)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] font-bold">
              <span>❌ 40</span>
              <span className="text-[10px] font-normal">يحتاج إعادة</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
