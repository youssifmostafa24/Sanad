import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, X, Check } from 'lucide-react';
import { CustomSelectDropdown, DropdownOption } from './CustomSelectDropdown';

interface OnTimeBadgeProps {
  value: number | null | undefined;
  editable?: boolean;
  onChange?: (val: number | null) => void;
  idPrefix?: string;
  className?: string;
}

export function getOnTimeTheme(val: number | null | undefined) {
  if (val === null || val === undefined) {
    return {
      badgeBg: 'bg-[#FBF6E8]',
      badgeText: 'text-[#5B6478]',
      badgeBorder: 'border-[#B8860B]/20',
      chevron: 'text-[#5B6478]/70',
      label: 'غير محدد',
    };
  }
  if (val >= 95) {
    return {
      badgeBg: 'bg-[#16A34A]/25',
      badgeText: 'text-[#15803D]',
      badgeBorder: 'border-[#16A34A]/40',
      chevron: 'text-[#15803D]/70',
      label: 'حضور دقيق في الموعد',
    };
  }
  if (val >= 85) {
    return {
      badgeBg: 'bg-[#16A34A]/12',
      badgeText: 'text-[#166534]',
      badgeBorder: 'border-[#16A34A]/25',
      chevron: 'text-[#166534]/70',
      label: 'تأخير بسيط جداً',
    };
  }
  if (val >= 75) {
    return {
      badgeBg: 'bg-[#FEF9C3]',
      badgeText: 'text-[#854D0E]',
      badgeBorder: 'border-[#FDE047]',
      chevron: 'text-[#854D0E]/70',
      label: 'تأخير متوسط',
    };
  }
  if (val >= 65) {
    return {
      badgeBg: 'bg-[#FEE2E2]',
      badgeText: 'text-[#991B1B]',
      badgeBorder: 'border-[#FCA5A5]',
      chevron: 'text-[#991B1B]/70',
      label: 'تأخير ملحوظ',
    };
  }
  return {
    badgeBg: 'bg-[#EF4444]/28',
    badgeText: 'text-[#7F1D1D]',
    badgeBorder: 'border-[#EF4444]/50',
    chevron: 'text-[#7F1D1D]/70',
    label: 'تأخير كبير',
  };
}

export const OnTimeBadge: React.FC<OnTimeBadgeProps> = ({
  value,
  editable = false,
  onChange,
  idPrefix = 'ontime',
  className = '',
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = getOnTimeTheme(value);

  // Close info on click outside or Escape
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

  const onTimeOptions: DropdownOption<number | null>[] = [
    {
      value: null,
      label: 'غير محدد',
      badgeContent: '—',
      badgeStyle: 'bg-[#FBF6E8] text-[#5B6478] border-[#B8860B]/20 font-sans',
    },
    {
      value: 100,
      label: '100% (حضور في الموعد)',
      badgeContent: '100%',
      badgeStyle: 'bg-[#16A34A]/25 text-[#15803D] border-[#16A34A]/40 font-sans',
    },
    {
      value: 90,
      label: '90% (تأخير خفيف)',
      badgeContent: '90%',
      badgeStyle: 'bg-[#16A34A]/12 text-[#166534] border-[#16A34A]/25 font-sans',
    },
    {
      value: 80,
      label: '80% (تأخير 5-10 دقائق)',
      badgeContent: '80%',
      badgeStyle: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] font-sans',
    },
    {
      value: 70,
      label: '70% (تأخير ملحوظ)',
      badgeContent: '70%',
      badgeStyle: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5] font-sans',
    },
    {
      value: 60,
      label: '60% (تأخير كبير)',
      badgeContent: '60%',
      badgeStyle: 'bg-[#EF4444]/28 text-[#7F1D1D] border-[#EF4444]/50 font-sans',
    },
  ];

  return (
    <div
      ref={containerRef}
      id={`${idPrefix}-card`}
      onClick={(e) => {
        e.stopPropagation();
        if (!editable) {
          setShowInfo((prev) => !prev);
        } else {
          setIsDropdownOpen((prev) => !prev);
        }
      }}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={(e) => {
        if (editable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsDropdownOpen((prev) => !prev);
        }
      }}
      className={`relative flex flex-col items-center justify-between rounded-2xl bg-white py-1.5 px-1 text-center transition-all duration-200 select-none shrink-0 w-[44px] sm:w-[48px] min-h-[44px] self-stretch ${
        editable ? 'cursor-pointer hover:ring-2 hover:ring-[#B8860B]/40 active:scale-95' : 'cursor-pointer active:scale-95'
      } ${className}`}
      title={
        value !== null && value !== undefined
          ? `تقييم الحضور في الموعد (On Time): ${value}% - ${theme.label}`
          : 'تقييم الحضور في الموعد (On Time): غير محدد'
      }
    >
      {/* Top Header Label */}
      <div className="flex flex-col items-center justify-center w-full leading-none">
        <span className="text-[9px] sm:text-[9.5px] font-black tracking-tight uppercase leading-none block text-[#5B6478]">
          ON
        </span>
        <span className="text-[8.5px] sm:text-[9px] font-black tracking-tight uppercase leading-none block mt-0.5 text-[#5B6478]">
          TIME
        </span>
      </div>

      {/* Inner Colored Pill for Score + % */}
      <div
        className={`w-full py-1 px-0.5 rounded-full border flex flex-col items-center justify-center shadow-2xs leading-none transition-all ${
          theme.badgeBg
        } ${theme.badgeText} ${theme.badgeBorder}`}
      >
        <div className="flex items-center justify-center gap-0.5 leading-none">
          <span className="text-xs sm:text-[13px] font-black font-sans tracking-tight leading-none tabular-nums">
            {value !== null && value !== undefined ? value : '—'}
          </span>
        </div>

        {/* Percentage Sign (%) under the number */}
        {value !== null && value !== undefined && (
          <span className="text-[8.5px] sm:text-[9px] font-black leading-none mt-0.5 font-sans">
            %
          </span>
        )}
      </div>

      {/* Custom Dropdown for Teacher Mode */}
      {editable && onChange && (
        <CustomSelectDropdown<number | null>
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          triggerRef={containerRef}
          selectedValue={value === undefined ? null : value}
          onSelect={(newVal) => {
            onChange(newVal);
          }}
          title="تقييم الحضور في الموعد"
          width={240}
          align="center"
          dir="rtl"
          idPrefix={idPrefix}
          options={onTimeOptions}
        />
      )}

      {/* Tap Explanation Popover for Students (Priority 2.3) */}
      {showInfo && !editable && (
        <div
          id={`${idPrefix}-info-popover`}
          className="absolute top-full mt-2 left-0 z-50 w-52 bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-xl border border-[#B8860B]/35 p-3 text-right font-sans select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#B8860B]/20">
            <span className="text-xs font-bold text-[#0E5C56]">تقييم الحضور في الموعد</span>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#5B6478] leading-relaxed">
            يقيس مدى التزام الطالب بالحضور في بداية وقت الحصة بدقة. النسبة الحالية:{' '}
            <strong className="text-[#0E5C56]">
              {value !== null && value !== undefined ? `${value}% (${theme.label})` : 'لم تُسجل بعد'}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};
