import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import {
  QURAN_SURAHS,
  SURAH_STATUS_OPTIONS,
  getSurahStatusMeta,
} from '../data/quranSurahs';
import { Student, SurahMemorizationStatus } from '../types';

interface SurahProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  isTeacherMode: boolean;
  onUpdateSurahStatus: (studentId: string, surahNumber: number, status: SurahMemorizationStatus) => void;
}

export const SurahProgressModal: React.FC<SurahProgressModalProps> = ({
  isOpen,
  onClose,
  student,
  isTeacherMode,
  onUpdateSurahStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const ratings = student.surahRatings || {};

  // Compute status counts
  const statusCounts = useMemo(() => {
    const counts: Record<SurahMemorizationStatus, number> = {
      not_memorized: 0,
      in_progress: 0,
      strong: 0,
      medium: 0,
      weak: 0,
      forgot: 0,
    };

    QURAN_SURAHS.forEach((s) => {
      const st = ratings[s.number] || 'not_memorized';
      counts[st] = (counts[st] || 0) + 1;
    });

    return counts;
  }, [ratings]);

  // Filter surahs: ordered from Surat An-Nas (114) down to Surat Al-Fatihah (1)
  const filteredSurahs = useMemo(() => {
    const reversedSurahs = [...QURAN_SURAHS].reverse();
    return reversedSurahs.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.arabicName.includes(searchQuery.trim()) ||
        s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        String(s.number) === searchQuery.trim();

      if (!matchesSearch) return false;

      const currentStatus = ratings[s.number] || 'not_memorized';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter, ratings]);

  if (!isOpen) return null;

  return (
    <div
      id="surah-progress-overlay"
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="surah-progress-modal"
        className="w-full max-w-3xl max-h-[90vh] bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-2xl border border-[#B8860B]/30 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-between border-b border-[#B8860B]/40 select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
              style={{ backgroundColor: student.color }}
            >
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B8860B]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F1E7CE]">
                  سجل حفظ القرآن الكريم — {student.name}
                </h2>
              </div>
              <p className="text-[11px] text-[#F1E7CE]/80 font-medium">
                {isTeacherMode
                  ? 'وضع المعلم: يمكنك تعديل حالة أي سورة مباشرة من القائمة المنسدلة'
                  : 'عرض تقييمات حفظ السور للطالب'}
              </p>
            </div>
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

        {/* Stats summary badges */}
        <div className="px-4 py-2.5 bg-white border-b border-[#B8860B]/20 flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto text-[11px]">
          {SURAH_STATUS_OPTIONS.map((opt) => {
            const count = statusCounts[opt.value];
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(isSelected ? 'all' : opt.value)}
                className={`px-2.5 py-1 rounded-full text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSelected ? 'ring-2 ring-offset-1 ring-[#0E5C56]' : 'opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: opt.bgColor }}
              >
                <span>{opt.shortLabel}</span>
                <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px] tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-[11px] font-bold text-[#0E5C56] hover:underline px-1.5"
            >
              عرض الكل (114)
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="p-3 bg-[#FBF6E8] border-b border-[#B8860B]/20 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5B6478] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم السورة (مثل: الكهف، مريم) أو رقمها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#B8860B]/30 rounded-xl pr-9 pl-3 py-1.5 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#5B6478]/60 focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 font-arabic"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#5B6478] hover:text-[#1F2A3D] px-2 py-1"
            >
              مسح
            </button>
          )}
        </div>

        {/* Surahs List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredSurahs.length === 0 ? (
            <div className="text-center py-10 text-xs sm:text-sm text-[#5B6478]">
              لا توجد سور مطابقة للبحث أو الفلتر المحدد.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredSurahs.map((surah) => {
                const currentStatus = ratings[surah.number] || 'not_memorized';
                const meta = getSurahStatusMeta(currentStatus);

                return (
                  <div
                    key={surah.number}
                    className="relative px-2 py-3 rounded-xl shadow-2xs flex items-center justify-center text-center transition-all hover:brightness-105 active:scale-95 cursor-pointer min-h-[46px] border border-white/20"
                    style={{
                      backgroundColor: meta.bgColor,
                    }}
                    title={
                      isTeacherMode
                        ? `سورة ${surah.arabicName} — اضغط لتغيير التقييم`
                        : `سورة ${surah.arabicName}`
                    }
                  >
                    {/* Surah Name Only */}
                    <span className="text-xs sm:text-sm font-bold text-white font-arabic truncate drop-shadow-2xs select-none">
                      سورة {surah.arabicName}
                    </span>

                    {/* In Teacher Mode: Transparent full-card select to change status on click */}
                    {isTeacherMode && (
                      <select
                        aria-label={`تقييم سورة ${surah.arabicName}`}
                        value={currentStatus}
                        onChange={(e) =>
                          onUpdateSurahStatus(
                            student.id,
                            surah.number,
                            e.target.value as SurahMemorizationStatus
                          )
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title={`اضغط لتغيير تقييم سورة ${surah.arabicName}`}
                      >
                        {SURAH_STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="text-black bg-white"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-white border-t border-[#B8860B]/20 flex items-center justify-between text-xs text-[#5B6478] shrink-0">
          <span>
            إجمالي السور المعروضة: <b>{filteredSurahs.length}</b> من 114
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0E5C56] text-[#F1E7CE] font-bold rounded-lg hover:bg-[#0A423E] transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
