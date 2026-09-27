import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { QuranSurah, SURAH_STATUS_OPTIONS, getSurahStatusMeta } from '../data/quranSurahs';
import { SurahMemorizationStatus } from '../types';

interface SurahStatusDotProps {
  surah: QuranSurah;
  status?: SurahMemorizationStatus;
  isTeacherMode: boolean;
  onUpdateStatus?: (surahNumber: number, status: SurahMemorizationStatus) => void;
  idPrefix?: string;
}

// Icon helper for colorblind accessibility
function getStatusSymbol(status?: string | SurahMemorizationStatus): string {
  switch (status) {
    case 'strong':
      return '✓';
    case 'medium':
      return '•';
    case 'in_progress':
      return '⏳';
    case 'weak':
      return '!';
    case 'forgot':
      return '✕';
    case 'not_memorized':
    default:
      return '—';
  }
}

export const SurahStatusDot: React.FC<SurahStatusDotProps> = ({
  surah,
  status = 'not_memorized',
  isTeacherMode,
  onUpdateStatus,
  idPrefix = 'surah-status-dot',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; openUpwards: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentMeta = getSurahStatusMeta(status);
  const symbol = getStatusSymbol(status);

  const updateCoordinates = (popoverHeight: number = 240) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const width = 210; // streamlined popover width
    let left = rect.left;
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }
    if (left < 10) left = 10;

    const top = shouldOpenUpwards ? rect.top - popoverHeight - 6 : rect.bottom + 6;

    setPopoverCoords({
      top: Math.max(10, top),
      left,
      openUpwards: shouldOpenUpwards,
    });
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      updateCoordinates(240);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close popover on click outside, scroll, or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) updateCoordinates(240);
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
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <button
        ref={buttonRef}
        id={`${idPrefix}-${surah.number}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleOpen();
        }}
        className="min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] p-1.5 -m-1.5 flex items-center justify-center cursor-pointer focus:outline-none"
        title={`${surah.name} • ${currentMeta.shortLabel}`}
        aria-label={`Status for ${surah.name}: ${currentMeta.shortLabel}`}
        aria-expanded={isOpen}
      >
        <span
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs transition-transform hover:scale-115 active:scale-95 ${
            isTeacherMode ? 'ring-1.5 ring-[#B8860B]/70 ring-offset-1' : ''
          }`}
          style={{ backgroundColor: currentMeta.bgColor }}
        >
          {symbol !== '—' && <span className="leading-none select-none">{symbol}</span>}
        </span>
      </button>

      {/* Simplified Status Popover (Requirements 7 & 8: No surah name, no verse count, no edit title — only status options list) */}
      {isOpen && popoverCoords && createPortal(
        <div
          ref={popoverRef}
          id={`${idPrefix}-popover-${surah.number}`}
          style={{
            position: 'fixed',
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            width: '210px',
            zIndex: 99999,
          }}
          className="bg-[#FDFBF7] rounded-2xl shadow-2xl border-2 border-[#B8860B]/45 p-2 text-left font-sans select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
          dir="ltr"
        >
          {/* Status Options List Only */}
          <div className="flex flex-col gap-1.5">
            {SURAH_STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.value === status;
              const optSymbol = getStatusSymbol(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isTeacherMode) {
                      onUpdateStatus?.(surah.number, opt.value);
                    }
                    setIsOpen(false);
                  }}
                  style={{ backgroundColor: opt.bgColor }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-2xs hover:brightness-110 ${
                    isSelected ? 'ring-2 ring-[#0E5C56] ring-offset-1' : 'opacity-95 hover:opacity-100'
                  } ${isTeacherMode ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-1.5">
                    {optSymbol !== '—' && <span className="font-mono text-xs">{optSymbol}</span>}
                    <span>{opt.shortLabel}</span>
                  </div>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 shrink-0" />
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
};
