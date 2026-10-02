import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import {
  QURAN_SURAHS,
  SURAH_STATUS_OPTIONS,
  getSurahStatusMeta,
} from '../data/quranSurahs';
import { Student, SurahMemorizationStatus } from '../types';
import { CustomSelectDropdown, DropdownOption } from './CustomSelectDropdown';

interface StudentMemorizationSummaryViewProps {
  student: Student | null;
  isTeacherMode: boolean;
  onUpdateSurahStatus: (surahNumber: number, status: SurahMemorizationStatus) => void;
  onReturnToHomework?: () => void;
}

export const StudentMemorizationSummaryView: React.FC<StudentMemorizationSummaryViewProps> = ({
  student,
  isTeacherMode,
  onUpdateSurahStatus,
}) => {
  if (!student) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeSurahForStatus, setActiveSurahForStatus] = useState<{
    surahNumber: number;
    surahName: string;
    surahArabic: string;
    currentStatus: SurahMemorizationStatus;
  } | null>(null);
  const activeTriggerRef = useRef<HTMLDivElement | null>(null);

  // Reactive local ratings state to guarantee instant background color change on selection
  const [localRatings, setLocalRatings] = useState<Record<number, SurahMemorizationStatus>>(() => ({
    ...(student.surahRatings || {}),
  }));

  useEffect(() => {
    setLocalRatings(student.surahRatings || {});
  }, [student.surahRatings]);

  const handleStatusChange = (surahNumber: number, newStatus: SurahMemorizationStatus) => {
    setLocalRatings((prev) => ({
      ...prev,
      [surahNumber]: newStatus,
    }));
    onUpdateSurahStatus(surahNumber, newStatus);
  };

  const surahStatusOptions: DropdownOption<SurahMemorizationStatus>[] = SURAH_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    badgeContent: (
      <span
        className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center shadow-2xs"
        style={{ backgroundColor: opt.bgColor }}
      />
    ),
    badgeStyle: 'bg-transparent border-none p-0',
  }));

  // Compute status counts dynamically from localRatings
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
      const st = localRatings[s.number] || 'not_memorized';
      counts[st] = (counts[st] || 0) + 1;
    });

    return counts;
  }, [localRatings]);

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

      const currentStatus = localRatings[s.number] || 'not_memorized';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter, localRatings]);

  return (
    <div id="memorization-summary-full-view" className="w-full pt-1 pb-4 flex flex-col space-y-3">
      {/* Top Filter & Search Card */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#B8860B]/20 flex flex-col space-y-3">
        {/* Stats Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
          {SURAH_STATUS_OPTIONS.map((opt) => {
            const count = statusCounts[opt.value];
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(isSelected ? 'all' : opt.value)}
                className={`px-2.5 py-1 rounded-full text-[#1F2A3D] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-black/5 ${
                  isSelected ? 'ring-2 ring-offset-1 ring-[#0E5C56]' : 'opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: opt.bgColor }}
              >
                <span className="text-xs font-bold text-[#1F2A3D]">{opt.shortLabel}</span>
                <span className="px-1.5 py-0.2 bg-black/10 text-[#1F2A3D] rounded-full text-[10px] font-bold tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-[11px] font-bold text-[#0E5C56] hover:underline px-1.5 cursor-pointer"
            >
              Show All (114)
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full pt-1">
          <Search className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Surah name (e.g. Al-Mulk, Yasin) or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#5B6478]/60 focus:outline-none focus:ring-2 focus:ring-[#0E5C56]/20 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#5B6478] hover:text-[#1F2A3D] px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Surahs Grid Card */}
      <div className="w-full bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-[#B8860B]/20">
        {filteredSurahs.length === 0 ? (
          <div className="text-center py-12 text-xs sm:text-sm text-[#5B6478]">
            No Surahs match the current search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 sm:gap-2.5">
            {filteredSurahs.map((surah) => {
              const currentStatus = localRatings[surah.number] || 'not_memorized';
              const meta = getSurahStatusMeta(currentStatus);

              return (
                <div
                  key={surah.number}
                  onClick={(e) => {
                    if (isTeacherMode) {
                      e.stopPropagation();
                      activeTriggerRef.current = e.currentTarget;
                      setActiveSurahForStatus({
                        surahNumber: surah.number,
                        surahName: surah.name,
                        surahArabic: surah.arabicName,
                        currentStatus,
                      });
                    }
                  }}
                  role={isTeacherMode ? 'button' : undefined}
                  tabIndex={isTeacherMode ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isTeacherMode && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      activeTriggerRef.current = e.currentTarget as HTMLDivElement;
                      setActiveSurahForStatus({
                        surahNumber: surah.number,
                        surahName: surah.name,
                        surahArabic: surah.arabicName,
                        currentStatus,
                      });
                    }
                  }}
                  className={`relative px-2 py-2.5 sm:py-3 rounded-xl shadow-2xs flex items-center justify-center text-center transition-all hover:brightness-105 active:scale-95 min-h-[46px] border border-black/10 select-none ${
                    isTeacherMode ? 'cursor-pointer hover:ring-2 hover:ring-[#1F2A3D]/40' : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: meta.bgColor,
                  }}
                  title={
                    isTeacherMode
                      ? `${surah.name} (${surah.arabicName}) — اضغط لتعديل حالة الحفظ`
                      : `${surah.name} (${surah.arabicName})`
                  }
                >
                  {/* Surah Name: English - Arabic */}
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full px-0.5 select-none pointer-events-none truncate text-[#1F2A3D]">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1F2A3D] font-sans tracking-tight shrink-0">
                      {surah.name}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold font-serif truncate text-[#1F2A3D]">
                      - {surah.arabicName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Dropdown for Teacher Status Selection */}
      {activeSurahForStatus && (
        <CustomSelectDropdown<SurahMemorizationStatus>
          isOpen={true}
          onClose={() => setActiveSurahForStatus(null)}
          triggerRef={activeTriggerRef}
          selectedValue={activeSurahForStatus.currentStatus}
          onSelect={(newStatus) => {
            handleStatusChange(activeSurahForStatus.surahNumber, newStatus);
            setActiveSurahForStatus(null);
          }}
          title={`حالة حفظ سورة ${activeSurahForStatus.surahArabic}`}
          width={240}
          align="center"
          dir="rtl"
          idPrefix={`surah-status-${activeSurahForStatus.surahNumber}`}
          options={surahStatusOptions}
        />
      )}
    </div>
  );
};
