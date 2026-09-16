import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { QuranSurah, SURAH_STATUS_OPTIONS, getSurahStatusMeta } from '../data/quranSurahs';
import { SurahMemorizationStatus } from '../types';

interface SurahStatusDotProps {
  surah: QuranSurah;
  status?: SurahMemorizationStatus;
  isTeacherMode: boolean;
  onUpdateStatus?: (surahNumber: number, status: SurahMemorizationStatus) => void;
  idPrefix?: string;
}

export const SurahStatusDot: React.FC<SurahStatusDotProps> = ({
  surah,
  status = 'not_memorized',
  isTeacherMode,
  onUpdateStatus,
  idPrefix = 'surah-status-dot',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMeta = getSurahStatusMeta(status);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // In Student Mode: display-only colored dot with tooltip
  if (!isTeacherMode) {
    return (
      <span
        id={`${idPrefix}-${surah.number}`}
        className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-2xs transition-colors select-none"
        style={{ backgroundColor: currentMeta.bgColor }}
        title={`${surah.arabicName} • ${currentMeta.shortLabel}`}
        aria-label={`حالة سورة ${surah.arabicName}: ${currentMeta.shortLabel}`}
      />
    );
  }

  // In Teacher Mode: interactive dot that opens the status selector popover
  return (
    <div ref={containerRef} className="relative inline-flex items-center shrink-0 z-30">
      <button
        id={`${idPrefix}-${surah.number}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-2xs cursor-pointer transition-transform hover:scale-125 focus:outline-none ring-offset-1 focus:ring-2 focus:ring-[#B8860B]/60"
        style={{ backgroundColor: currentMeta.bgColor }}
        title={`${surah.arabicName} • ${currentMeta.shortLabel} (اضغط لتغيير الحالة)`}
        aria-label={`تعديل حالة حفظ سورة ${surah.arabicName}`}
        aria-expanded={isOpen}
      />

      {/* Floating Status Selector Popover for Teacher */}
      {isOpen && (
        <div
          id={`${idPrefix}-popover-${surah.number}`}
          className="absolute top-full mt-2 left-0 z-50 w-48 sm:w-52 bg-[#FDFBF7] rounded-2xl shadow-xl border border-[#B8860B]/30 p-2.5 text-right font-sans select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#B8860B]/20">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: currentMeta.bgColor }}
              />
              <span className="text-xs font-bold text-[#0E5C56]">
                حالة {surah.arabicName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-[#5B6478] hover:text-[#1F2A3D] hover:bg-[#F3EAD3]/50 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Options matching exactly the requested badge styles */}
          <div className="flex flex-col gap-1.5">
            {SURAH_STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.value === status;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onUpdateStatus?.(surah.number, opt.value);
                    setIsOpen(false);
                  }}
                  style={{ backgroundColor: opt.bgColor }}
                  className={`w-full flex items-center justify-between px-3 py-1 sm:py-1.5 rounded-full text-white text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs hover:brightness-110 ${
                    isSelected ? 'ring-2 ring-[#0E5C56] ring-offset-1' : 'opacity-95 hover:opacity-100'
                  }`}
                >
                  <span className="font-sans tracking-wide">{opt.shortLabel}</span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
