import React from 'react';
import { ChevronDown } from 'lucide-react';

interface OnTimeBadgeProps {
  value: number | null | undefined;
  editable?: boolean;
  onChange?: (val: number | null) => void;
  idPrefix?: string;
  className?: string;
}

/**
 * Returns color tokens based on score (60 to 100) exactly matching GradeBadge colors:
 * Outer card has a white background blending with the row.
 * Inner score pill (+ %) has the dynamic grade color:
 * 100: نفس لون الـ 100 (أخضر زاهي)
 * 90: نفس لون الـ 80 (أخضر هادئ)
 * 80: نفس لون الـ 60 (أصفر)
 * 70: نفس لون الـ 40 (وردي / أحمر فاتح)
 * 60: نفس لون الـ 20 (أحمر)
 */
export function getOnTimeTheme(val: number | null | undefined) {
  if (val === null || val === undefined) {
    return {
      badgeBg: 'bg-[#FBF6E8]',
      badgeText: 'text-[#5B6478]',
      badgeBorder: 'border-[#B8860B]/20',
      chevron: 'text-[#5B6478]/70',
    };
  }
  if (val >= 95) {
    // 100: مكان الـ 100 في التقييمات (Green 100)
    return {
      badgeBg: 'bg-[#16A34A]/25',
      badgeText: 'text-[#15803D]',
      badgeBorder: 'border-[#16A34A]/40',
      chevron: 'text-[#15803D]/70',
    };
  }
  if (val >= 85) {
    // 90: مكان الـ 80 في التقييمات (Light Green 80)
    return {
      badgeBg: 'bg-[#16A34A]/12',
      badgeText: 'text-[#166534]',
      badgeBorder: 'border-[#16A34A]/25',
      chevron: 'text-[#166534]/70',
    };
  }
  if (val >= 75) {
    // 80: مكان الـ 60 في التقييمات (Yellow 60)
    return {
      badgeBg: 'bg-[#FEF9C3]',
      badgeText: 'text-[#854D0E]',
      badgeBorder: 'border-[#FDE047]',
      chevron: 'text-[#854D0E]/70',
    };
  }
  if (val >= 65) {
    // 70: مكان الـ 40 في التقييمات (Light Red 40)
    return {
      badgeBg: 'bg-[#FEE2E2]',
      badgeText: 'text-[#991B1B]',
      badgeBorder: 'border-[#FCA5A5]',
      chevron: 'text-[#991B1B]/70',
    };
  }
  // 60: مكان الـ 20 في التقييمات (Red 20)
  return {
    badgeBg: 'bg-[#EF4444]/28',
    badgeText: 'text-[#7F1D1D]',
    badgeBorder: 'border-[#EF4444]/50',
    chevron: 'text-[#7F1D1D]/70',
  };
}

export const OnTimeBadge: React.FC<OnTimeBadgeProps> = ({
  value,
  editable = false,
  onChange,
  idPrefix = 'ontime',
  className = '',
}) => {
  const theme = getOnTimeTheme(value);

  return (
    <div
      id={`${idPrefix}-card`}
      className={`relative flex flex-col items-center justify-between rounded-2xl bg-white py-1.5 px-1 text-center transition-all duration-200 select-none shrink-0 w-[44px] sm:w-[48px] self-stretch ${className}`}
      title={
        value !== null && value !== undefined
          ? `تقييم وقت دخول الحصة (On Time): ${value}%`
          : 'تقييم وقت دخول الحصة (On Time): غير محدد'
      }
    >
      {/* Top Header Label: Stacked ON and TIME in neutral style */}
      <div className="flex flex-col items-center justify-center w-full leading-none">
        <span className="text-[9px] sm:text-[9.5px] font-black tracking-tight uppercase leading-none block text-[#5B6478]">
          ON
        </span>
        <span className="text-[8.5px] sm:text-[9px] font-black tracking-tight uppercase leading-none block mt-0.5 text-[#5B6478]">
          TIME
        </span>
      </div>

      {/* Inner Colored Pill for Score + % (matches GradeBadge style) */}
      <div
        className={`w-full py-1 px-0.5 rounded-full border flex flex-col items-center justify-center shadow-2xs leading-none transition-all ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
      >
        <div className="flex items-center justify-center gap-0.5 leading-none">
          <span className="text-xs sm:text-[13px] font-black font-sans tracking-tight leading-none tabular-nums">
            {value !== null && value !== undefined ? value : '—'}
          </span>
          {editable && (
            <ChevronDown className={`w-2.5 h-2.5 shrink-0 stroke-[2.5] ${theme.chevron}`} />
          )}
        </div>

        {/* Percentage Sign (%) under the number */}
        {value !== null && value !== undefined && (
          <span className="text-[8.5px] sm:text-[9px] font-black leading-none mt-0.5 font-sans">
            %
          </span>
        )}
      </div>

      {/* Interactive Select Overlay for Teacher Mode */}
      {editable && onChange && (
        <select
          id={`${idPrefix}-select`}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : Number(val));
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 text-black"
          title="اضغط لتحديد وقت دخول الحصة (On Time)"
          dir="ltr"
        >
          <option value="">—</option>
          <option value="100">100</option>
          <option value="90">90</option>
          <option value="80">80</option>
          <option value="70">70</option>
          <option value="60">60</option>
        </select>
      )}
    </div>
  );
};

