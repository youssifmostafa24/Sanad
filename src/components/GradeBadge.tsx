import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { GradeValue } from '../types';

export interface GradeStyleMeta {
  bg: string;
  text: string;
  border: string;
  icon: string;
  score: string | number;
  label: string;
}

export const getGradeBadgeStyle = (val: GradeValue | null | undefined): GradeStyleMeta => {
  if (val === null || val === undefined) {
    return {
      bg: 'bg-[#F4F5F7]',
      text: 'text-[#5B6478]',
      border: 'border-gray-200',
      icon: '—',
      score: '—',
      label: 'بدون تقييم',
    };
  }

  // 100 and 90 -> double green check
  if (val >= 90) {
    return {
      bg: 'bg-[#E2F7EB]',
      text: 'text-[#0E5C56]',
      border: 'border-[#A3E6C3]',
      icon: '✅✅',
      score: val,
      label: 'ممتاز جداً',
    };
  }
  // 80 and 70 -> single green check
  if (val >= 70) {
    return {
      bg: 'bg-[#EAF6EE]',
      text: 'text-[#166534]',
      border: 'border-[#BBF7D0]',
      icon: '✅',
      score: val,
      label: 'جيد جداً',
    };
  }
  // 60 and 50 -> yellow square
  if (val >= 50) {
    return {
      bg: 'bg-[#FEF9C3]',
      text: 'text-[#854D0E]',
      border: 'border-[#FDE047]',
      icon: '🟨',
      score: val,
      label: 'جيد',
    };
  }
  // 40 and 30 -> single red X
  if (val >= 30) {
    return {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      border: 'border-[#FCA5A5]',
      icon: '❌',
      score: val,
      label: 'يحتاج مراجعة',
    };
  }
  // 20 and 10 -> double red X
  return {
    bg: 'bg-[#EF4444]/20',
    text: 'text-[#7F1D1D]',
    border: 'border-[#EF4444]/40',
    icon: '❌❌',
    score: val,
    label: 'إعادة وتثبيت',
  };
};

const GRADE_STEPS: GradeValue[] = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

interface GradeBadgeProps {
  grade: GradeValue | null;
  editable?: boolean;
  onChange?: (grade: GradeValue | null) => void;
  idPrefix?: string;
  className?: string;
  size?: 'default' | 'editor';
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  editable = false,
  onChange,
  idPrefix = 'grade-badge',
  className = '',
  size = 'default',
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const style = getGradeBadgeStyle(grade);
  const isEditorSize = size === 'editor';
  const isNullGrade = grade === null || grade === undefined;

  const bgClass = isEditorSize && isNullGrade ? 'bg-white' : style.bg;
  const borderClass = isEditorSize && isNullGrade ? 'border-[#D3CDBB]' : style.border;

  const buttonClasses = isEditorSize
    ? `h-[52px] min-w-[64px] px-3 inline-flex items-center justify-center gap-1.5 rounded-[12px] text-xs sm:text-sm font-bold ${bgClass} ${style.text} border ${borderClass} shadow-2xs whitespace-nowrap select-none cursor-pointer active:scale-95 transition-all hover:border-[#156E67]`
    : `h-[26px] sm:h-[30px] md:h-[34px] px-2.5 sm:px-3 md:px-3.5 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-xs sm:text-[13px] md:text-sm font-bold ${style.bg} ${style.text} border ${style.border} shadow-2xs whitespace-nowrap select-none cursor-pointer active:scale-95 transition-transform`;

  // Calculate coordinates for the popup
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = 270;
    const popupHeight = 340;

    let left = rect.right - width;
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards = spaceBelow < popupHeight && rect.top > popupHeight;
    const top = shouldOpenUpwards ? rect.top - popupHeight - 6 : rect.bottom + 6;

    setCoords({
      top: Math.max(10, Math.min(window.innerHeight - popupHeight - 10, top)),
      left,
    });
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isDropdownOpen]);

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

  // In Editable (Teacher) Mode
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
          className={buttonClasses}
          title="اضغط لتغيير درجة التقييم"
          aria-label="تحديد درجة التقييم"
          aria-expanded={isDropdownOpen}
          aria-haspopup="dialog"
        >
          <span className="text-[10px] sm:text-[11.5px] md:text-xs leading-none">{style.icon}</span>
          <span className="tabular-nums font-sans leading-none">{style.score}</span>
        </button>

        {isDropdownOpen && coords && createPortal(
          <div
            ref={dropdownRef}
            id={`${idPrefix}-grading-popup`}
            role="dialog"
            aria-label="تحديد درجة التقييم"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '270px',
              zIndex: 99999,
            }}
            className="bg-[#FDFBF7] rounded-2xl shadow-2xl border-2 border-[#B8860B]/40 p-2 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header: Title */}
            <div className="px-2 py-1 mb-2 border-b border-[#B8860B]/20 text-xs font-extrabold text-[#0E5C56] flex items-center justify-between">
              <span>تحديد درجة التقييم</span>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 cursor-pointer"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* "بدون تقييم" Full Width Pill Option */}
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsDropdownOpen(false);
              }}
              aria-label="بدون تقييم"
              className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer mb-2 border ${
                grade === null
                  ? 'bg-white text-[#0E5C56] border-[#0E5C56] ring-2 ring-[#0E5C56]/30 shadow-xs font-extrabold'
                  : 'bg-white text-[#5B6478] border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm leading-none">—</span>
                <span>بدون تقييم</span>
              </div>
              {grade === null && <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5]" />}
            </button>

            {/* 2-Column Grid of 10-Point Score Pills (100 down to 10) */}
            <div className="grid grid-cols-2 gap-1.5" dir="ltr">
              {GRADE_STEPS.map((scoreVal) => {
                const optStyle = getGradeBadgeStyle(scoreVal);
                const isSelected = grade === scoreVal;

                return (
                  <button
                    key={`${idPrefix}-score-${scoreVal}`}
                    type="button"
                    onClick={() => {
                      onChange(scoreVal);
                      setIsDropdownOpen(false);
                    }}
                    aria-label={`درجة ${scoreVal} ${optStyle.label}`}
                    className={`min-h-[44px] w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      optStyle.bg
                    } ${optStyle.text} ${
                      isSelected
                        ? 'border-[#0E5C56] ring-2 ring-[#0E5C56] shadow-xs font-extrabold'
                        : `${optStyle.border} hover:opacity-90`
                    }`}
                  >
                    <span className="text-xs leading-none shrink-0">{optStyle.icon}</span>
                    <span className="tabular-nums font-sans leading-none font-extrabold">{scoreVal}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0E5C56] stroke-[3] ml-0.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Student Mode: tap to show explanation sheet
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
        className={buttonClasses}
        title={`التقييم: ${style.score} (${style.label}) - اضغط للتفاصيل`}
        aria-label={`التقييم: ${style.score}`}
      >
        <span className="text-[10px] sm:text-[11.5px] md:text-xs leading-none">{style.icon}</span>
        <span className="tabular-nums font-sans leading-none">{style.score}</span>
      </button>

      {/* Tap Explanation Popover for Students */}
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
          <div className="space-y-1.5 text-[11px]" dir="ltr">
            <div className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#E2F7EB] text-[#0E5C56] font-bold">
              <span>✅✅ 100 - 90</span>
              <span className="text-[10px] font-normal" dir="rtl">ممتاز جداً</span>
            </div>
            <div className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#EAF6EE] text-[#166534] font-bold">
              <span>✅ 80 - 70</span>
              <span className="text-[10px] font-normal" dir="rtl">جيد جداً</span>
            </div>
            <div className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#FEF9C3] text-[#854D0E] font-bold">
              <span>🟨 60 - 50</span>
              <span className="text-[10px] font-normal" dir="rtl">جيد (مراجعة)</span>
            </div>
            <div className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#FEE2E2] text-[#991B1B] font-bold">
              <span>❌ 40 - 30</span>
              <span className="text-[10px] font-normal" dir="rtl">يحتاج إعادة</span>
            </div>
            <div className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#EF4444]/20 text-[#7F1D1D] font-bold">
              <span>❌❌ 20 - 10</span>
              <span className="text-[10px] font-normal" dir="rtl">إعادة وتثبيت</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
