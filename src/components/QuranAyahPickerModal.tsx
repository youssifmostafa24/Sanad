import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, BookOpen, Check, Edit3 } from 'lucide-react';
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
  title = 'تحديد الواجب من القرآن الكريم',
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
        // If it's a parsed surah >= 18, use dropdowns
        const validSurahNum = Math.max(18, parsed.surahNumber);
        setSelectedSurahNumber(validSurahNum);
        setFromAyah(parsed.fromAyah);
        setToAyah(parsed.toAyah);
        setFreeText(initialText);
        setIsFreeWriting(false);
      } else if (initialText && initialText.trim()) {
        // Non-standard text: activate free writing mode
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

  if (!isOpen) return null;

  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    const surah = PICKER_SURAHS.find((s) => s.number === surahNum);
    if (surah) {
      setFromAyah(1);
      setToAyah(Math.min(35, surah.ayahCount));
    }
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

  return (
    <div
      id="quran-ayah-picker-overlay"
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quran-ayah-picker-modal"
        className="w-full max-w-lg bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-2xl border border-[#B8860B]/30 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-between border-b border-[#B8860B]/40 select-none">
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
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Free Writing Toggle Switch (matching user image) */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-[#B8860B]/25 px-3.5 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#0E5C56]" />
              <span className="text-xs sm:text-sm font-bold text-[#1F2A3D]">
                تفعيل الكتابة الحرة للواجب
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
                isFreeWriting ? 'bg-[#0E5C56] justify-start' : 'bg-[#D1D5DB] justify-end'
              }`}
              title={isFreeWriting ? 'إلغاء الكتابة الحرة والعودة للقوائم' : 'تفعيل الكتابة الحرة'}
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
                اكتب نص الواجب المطلوب بحرية:
              </label>
              <textarea
                id="picker-free-text-input"
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="اكتب الواجب هنا بحرية عبر الكيبورد (مثال: حفظ سورة الكهف من آية 1 إلى 20)..."
                className="w-full bg-[#FAF6EE] border border-[#B8860B]/35 rounded-xl p-3 text-sm sm:text-base font-bold text-[#1F2A3D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 font-arabic resize-none"
                autoFocus
              />
            </div>
          ) : (
            /* Quran Surahs & Ayahs Dropdowns (Surah 18 to 114 only) */
            <div className="bg-white rounded-xl border border-[#B8860B]/25 p-3.5 shadow-2xs space-y-3">
              <p className="text-xs text-[#5B6478] font-medium">
                اختر السورة والآيات من القوائم المنسدلة (من سورة الكهف إلى سورة الناس):
              </p>

              <div className="flex items-center gap-2 sm:gap-3 w-full">
                {/* Dropdown 1: قائمة السور (من الكهف إلى الناس) بخط كبير */}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="picker-surah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1"
                  >
                    السورة:
                  </label>
                  <select
                    id="picker-surah-select"
                    value={selectedSurahNumber}
                    onChange={(e) => handleSurahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-3 text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs truncate"
                  >
                    {PICKER_SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        سورة {s.arabicName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: الآية الكبرى (الرقم الأكبر) بخط كبير */}
                <div className="w-20 sm:w-26 shrink-0">
                  <label
                    htmlFor="picker-to-ayah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1 text-center"
                  >
                    إلى:
                  </label>
                  <select
                    id="picker-to-ayah-select"
                    value={toAyah}
                    onChange={(e) => handleToAyahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-1.5 text-center text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs"
                    title="الرقم الأكبر"
                  >
                    {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => {
                      const isLast = n === currentSurah.ayahCount;
                      return (
                        <option key={`to-${n}`} value={n}>
                          {isLast && fromAyah === 1 ? `${n} (end-1)` : n}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Arrow: سهم يوضح من إلى */}
                <div
                  className="shrink-0 flex items-center justify-center text-[#0E5C56] pt-5 px-0.5"
                  title="إلى"
                >
                  <ArrowLeft className="w-5 h-5 font-black stroke-[2.5]" />
                </div>

                {/* Dropdown 3: الآية الصغرى (الرقم الأصغر) بخط كبير */}
                <div className="w-20 sm:w-26 shrink-0">
                  <label
                    htmlFor="picker-from-ayah-select"
                    className="block text-[11px] font-bold text-[#5B6478] mb-1 text-center"
                  >
                    من:
                  </label>
                  <select
                    id="picker-from-ayah-select"
                    value={fromAyah}
                    onChange={(e) => handleFromAyahChange(Number(e.target.value))}
                    className="w-full bg-[#FBF6E8]/90 border border-[#B8860B]/35 rounded-xl py-2.5 px-1.5 text-center text-sm sm:text-base font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 cursor-pointer shadow-2xs"
                    title="الرقم الأصغر"
                  >
                    {Array.from({ length: currentSurah.ayahCount }, (_, i) => i + 1).map((n) => (
                      <option key={`from-${n}`} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Helper action: end-1 shortcut button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#B8860B]/15">
                <span className="text-[11px] text-[#5B6478] font-medium">
                  عدد آيات سورة {currentSurah.arabicName}: {currentSurah.ayahCount} آية
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
                  title="السورة كاملة (end-1)"
                >
                  السورة كاملة (end-1)
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
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-[#86EFAC]" />
              <span>اعتماد الواجب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
