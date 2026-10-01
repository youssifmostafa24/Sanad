import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { Entry } from '../types';

interface MonthPickerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  entries: Entry[];
  onSelectMonth: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthPickerBottomSheet: React.FC<MonthPickerBottomSheetProps> = ({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  entries,
  onSelectMonth,
}) => {
  const [displayedYear, setDisplayedYear] = useState<number>(currentYear);

  useEffect(() => {
    if (isOpen) {
      setDisplayedYear(currentYear);
    }
  }, [isOpen, currentYear]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Set of year-month keys that have homework entries
  const monthsWithHomework = new Set<string>();
  entries.forEach((e) => {
    if (e.date) {
      const parts = e.date.split('-');
      if (parts.length >= 2) {
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        if (y && m) {
          monthsWithHomework.add(`${y}-${m}`);
        }
      }
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="month-picker-portal" className="fixed inset-0 z-50 overflow-hidden" dir="ltr">
          {/* Backdrop overlay */}
          <motion.div
            id="month-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
          />

          {/* Bottom Sheet panel */}
          <motion.div
            id="month-picker-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 mx-auto max-w-[490px] w-full bg-white rounded-t-[28px] shadow-2xl z-50 p-4 sm:p-5 flex flex-col border-t border-[#B8860B]/20"
          >
            {/* Drag handle pill */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

            {/* Sheet Title & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E5C56]" />
                <h3 className="font-sans font-bold text-sm text-[#0E5C56]">
                  Select Month
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Year Navigation Header */}
            <div className="flex items-center justify-between py-3 px-2">
              <button
                type="button"
                onClick={() => setDisplayedYear((y) => y - 1)}
                className="p-2 rounded-xl text-[#0E5C56] hover:bg-[#0E5C56]/10 active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Previous Year"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="font-sans font-extrabold text-lg text-[#0E5C56] tracking-wide">
                {displayedYear}
              </span>

              <button
                type="button"
                onClick={() => setDisplayedYear((y) => y + 1)}
                className="p-2 rounded-xl text-[#0E5C56] hover:bg-[#0E5C56]/10 active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Next Year"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 4x3 Grid of Months */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 pb-4">
              {MONTH_SHORT.map((shortName, idx) => {
                const monthNum = idx + 1;
                const monthKey = `${displayedYear}-${monthNum}`;
                const hasHomework = monthsWithHomework.has(monthKey);
                const isSelected =
                  displayedYear === currentYear && monthNum === currentMonth;

                return (
                  <button
                    key={`month-btn-${monthKey}`}
                    type="button"
                    disabled={!hasHomework}
                    onClick={() => {
                      if (hasHomework) {
                        onSelectMonth(displayedYear, monthNum);
                        onClose();
                      }
                    }}
                    className={`relative min-h-[50px] p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                      isSelected
                        ? 'bg-[#0E5C56] text-white font-bold shadow-md ring-2 ring-[#B8860B]/40'
                        : hasHomework
                        ? 'bg-[#FBF6E8] text-[#0E5C56] hover:bg-[#F3EAD3] font-semibold border border-[#B8860B]/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-50 text-slate-300 font-normal border border-slate-100 opacity-40 cursor-not-allowed'
                    }`}
                    title={
                      hasHomework
                        ? `${MONTH_NAMES[idx]} ${displayedYear}`
                        : `No homework recorded for ${MONTH_NAMES[idx]} ${displayedYear}`
                    }
                  >
                    <span className="text-sm font-sans tracking-tight">
                      {shortName}
                    </span>

                    {/* Small dot for months that have homework */}
                    {hasHomework && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSelected ? 'bg-[#E5C378]' : 'bg-[#0E5C56]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
