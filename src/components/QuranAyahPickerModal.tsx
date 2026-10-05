import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, BookOpen, Check, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  QURAN_SURAHS,
  QuranSurah,
  formatQuranHomework,
  parseQuranHomework,
} from '../data/quranSurahs';

// Only surahs from Al-Kahf (18) to An-Nas (114)
const PICKER_SURAHS: QuranSurah[] = QURAN_SURAHS.filter((s) => s.number >= 18);

interface QuranAyahPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (formattedText: string) => void;
  title?: string;
  initialText?: string;
  currentSurahStatus?: any;
  onUpdateSurahStatus?: (surahNumber: number, status: any) => void;
}

export const QuranAyahPickerModal: React.FC<QuranAyahPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Quran Homework',
  initialText = '',
}) => {
  const [isFreeWriting, setIsFreeWriting] = useState<boolean>(false);
  const [freeText, setFreeText] = useState<string>('');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(18); // 18: Al-Kahf
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(35);

  const currentSurah: QuranSurah =
    PICKER_SURAHS.find((s) => s.number === selectedSurahNumber) || PICKER_SURAHS[0];

  // Parse existing initialText on open
  useEffect(() => {
    if (isOpen) {
      const parsed = parseQuranHomework(initialText);
      if (parsed) {
        const validSurahNum = Math.max(18, parsed.surahNumber);
        setSelectedSurahNumber(validSurahNum);
        setFromAyah(parsed.fromAyah);
        setToAyah(parsed.toAyah);
        setFreeText(initialText);
        setIsFreeWriting(false);
      } else if (initialText && initialText.trim()) {
        setSelectedSurahNumber(18);
        setFromAyah(1);
        setToAyah(35);
        setFreeText(initialText);
        setIsFreeWriting(true);
      } else {
        setSelectedSurahNumber(18);
        setFromAyah(1);
        setToAyah(35);
        setFreeText('');
        setIsFreeWriting(false);
      }
    }
  }, [isOpen, initialText]);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    const surah = PICKER_SURAHS.find((s) => s.number === surahNum);
    const maxAyah = surah ? surah.ayahCount : 100;
    setFromAyah(1);
    setToAyah(Math.min(toAyah, maxAyah));
  };

  const handleFromAyahChange = (val: number) => {
    setFromAyah(val);
    if (toAyah < val) {
      setToAyah(val);
    }
  };

  const handleToAyahChange = (val: number) => {
    setToAyah(val);
    if (fromAyah > val) {
      setFromAyah(val);
    }
  };

  const handleConfirm = () => {
    if (isFreeWriting) {
      onSelect(freeText.trim());
    } else {
      const formatted = formatQuranHomework(
        currentSurah.arabicName,
        fromAyah,
        toAyah,
        currentSurah.ayahCount
      );
      onSelect(formatted);
    }
    onClose();
  };

  return createPortal(
    <div
      id="quran-ayah-picker-overlay"
      dir="ltr"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quran-ayah-picker-modal"
        className="w-full max-w-lg bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-2xl border border-[#B8860B]/30 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-between border-b border-[#B8860B]/40 select-none shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#B8860B]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F1E7CE]">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#F1E7CE]/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Free Writing Toggle Switch */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-[#B8860B]/25 px-3.5 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#0E5C56]" />
              <span className="text-xs sm:text-sm font-bold text-[#1F2A3D]">
                Custom Text Mode
              </span>
            </div>

            {/* Toggle Switch Pill */}
            <button
              type="button"
              id="picker-free-writing-toggle"
              role="switch"
              aria-checked={isFreeWriting}
              onClick={() => {
                const nextVal = !isFreeWriting;
                setIsFreeWriting(nextVal);
                if (nextVal && !freeText) {
                  const formatted = formatQuranHomework(
                    currentSurah.arabicName,
                    fromAyah,
                    toAyah,
                    currentSurah.ayahCount
                  );
                  setFreeText(formatted);
                }
              }}
              className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shadow-inner ${
                isFreeWriting ? 'bg-[#0E5C56] justify-end' : 'bg-[#D1D5DB] justify-start'
              }`}
              title={isFreeWriting ? 'Switch back to standard dropdowns' : 'Enable free text typing'}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="w-5 h-5 rounded-full bg-white shadow-md pointer-events-none"
              />
            </button>
          </div>

          {/* Conditional Display: Free writing keyboard area OR Quran Dropdowns */}
          {isFreeWriting ? (
            /* Free-form keyboard typing area */
            <div className="bg-white rounded-xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-2">
              <label
                htmlFor="picker-free-text-input"
                className="block text-xs sm:text-sm font-bold text-[#0E5C56]"
              >
                Type homework text freely:
              </label>
              <textarea
                id="picker-free-text-input"
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="e.g. Surah Al-Kahf 1 to 20 / سورة الكهف من 1 إلى 20..."
                className="w-full bg-[#FAF6EE] border border-[#B8860B]/35 rounded-xl p-3 text-sm sm:text-base font-bold text-[#1F2A3D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 font-sans resize-none"
                autoFocus
              />
            </div>
          ) : (
            /* Quran Surahs & Ayahs Dropdowns */
            <div className="bg-white rounded-xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-3">
              <p className="text-xs text-[#5B6478] font-medium">
                Select Surah and Ayah range from dropdowns:
              </p>

              <div className="flex items-center gap-2 sm:gap-3 w-full">
                {/* Dropdown 1: Surah */}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="picker-surah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1"
                  >
                    Surah:
                  </label>
                  <select
                    id="picker-surah-select"
                    value={selectedSurahNumber}
                    onChange={(e) => handleSurahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-3 text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs truncate"
                  >
                    {PICKER_SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.arabicName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: From Ayah */}
                <div className="w-20 sm:w-26 shrink-0">
                  <label
                    htmlFor="picker-from-ayah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1 text-center"
                  >
                    From:
                  </label>
                  <select
                    id="picker-from-ayah-select"
                    value={fromAyah}
                    onChange={(e) => handleFromAyahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-1.5 text-center text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs tabular-nums"
                  >
                    {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => (
                      <option key={`from-${n}`} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arrow */}
                <div
                  className="shrink-0 flex items-center justify-center text-[#0E5C56] pt-5 px-0.5"
                  title="to"
                >
                  <ArrowRight className="w-5 h-5 font-black stroke-[2.5]" />
                </div>

                {/* Dropdown 3: To Ayah */}
                <div className="w-20 sm:w-26 shrink-0">
                  <label
                    htmlFor="picker-to-ayah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1 text-center"
                  >
                    To:
                  </label>
                  <select
                    id="picker-to-ayah-select"
                    value={toAyah}
                    onChange={(e) => handleToAyahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-1.5 text-center text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs tabular-nums"
                  >
                    {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => {
                      const isLast = n === currentSurah.ayahCount;
                      return (
                        <option key={`to-${n}`} value={n}>
                          {isLast && fromAyah === 1 ? `${n} (كاملة)` : n}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Helper action: كاملة shortcut button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#B8860B]/15">
                <span className="text-[11px] text-[#5B6478] font-medium">
                  Total Ayahs in {currentSurah.name}: {currentSurah.ayahCount}
                </span>

                <button
                  type="button"
                  id="picker-full-surah-btn"
                  onClick={() => {
                    setFromAyah(1);
                    setToAyah(currentSurah.ayahCount);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                    fromAyah === 1 && toAyah === currentSurah.ayahCount
                      ? 'bg-[#0E5C56] text-[#F1E7CE] border-[#0E5C56]'
                      : 'text-[#0E5C56] hover:bg-[#0E5C56] hover:text-[#F1E7CE] bg-[#FBF6E8] border-[#B8860B]/30'
                  }`}
                  title="كاملة"
                >
                  كاملة
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons: Cancel and Confirm */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#5B6478] hover:bg-black/5 border border-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-[#86EFAC]" />
              <span>Confirm Homework</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
