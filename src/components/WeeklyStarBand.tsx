import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import {
  STAR_BAND_PRESETS,
  StarTier,
  getTierForStars,
  getTierLabel,
  getDefaultMotivationalTitle,
} from '../data/starBandPresets';

interface WeeklyStarBandProps {
  stars: number; // 0 to 5
  idPrefix?: string;
  title?: string; // e.g. "Amazing work this week! Keep shining! ⭐"
  subtitle?: string; // e.g. "Recite daily to unlock 5 full stars"
  isTeacherMode?: boolean;
  isPastWeek?: boolean;
  isManualOverride?: boolean;
  autoStars?: number;
  onUpdateMotivationalMessage?: (newMsg: string, newTitle?: string) => void;
  onSaveWeeklySettings?: (settings: {
    message: string;
    title: string;
    manualStars?: number;
    disableAuto: boolean;
  }) => void;
}

// Crisp, beautifully proportioned SVG 5-point star with #FF9400 color
const CrispStar: React.FC<{
  fillRatio: number; // 0 (empty), 0.5 (half), or 1 (full)
  className?: string;
}> = ({ fillRatio, className = 'w-6 h-6 sm:w-7 sm:h-7' }) => {
  const starPath =
    'M12 1.8l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.57l-6.18 3.25L7 14.01 2 9.07l6.91-1.01L12 1.8z';

  if (fillRatio >= 1) {
    // Fully solid star in #FF9400 with soft amber drop shadow
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${className} shrink-0 drop-shadow-[0_1.5px_3px_rgba(255,148,0,0.35)] transition-transform duration-200 hover:scale-105`}
        fill="#FF9400"
      >
        <path d={starPath} className="text-[#FF9400] fill-[#FF9400]" />
      </svg>
    );
  }

  if (fillRatio >= 0.5) {
    // Half-filled star
    const maskId = `half-star-mask-${Math.random().toString(36).substring(2, 7)}`;
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${className} shrink-0 drop-shadow-[0_1.5px_3px_rgba(255,148,0,0.25)] transition-transform duration-200`}
      >
        <defs>
          <linearGradient id={maskId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="#FF9400" />
            <stop offset="50%" stopColor="rgba(255, 148, 0, 0.3)" />
          </linearGradient>
        </defs>
        <path d={starPath} fill={`url(#${maskId})`} />
      </svg>
    );
  }

  // Faded / pending star in translucent #FF9400
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} shrink-0 opacity-80 transition-transform duration-200 hover:opacity-100`}
    >
      <path d={starPath} className="text-[#FF9400]/30 fill-[#FF9400]/30" />
    </svg>
  );
};

export const WeeklyStarBand: React.FC<WeeklyStarBandProps> = ({
  stars,
  idPrefix = 'weekly-star-band',
  title,
  subtitle,
  isTeacherMode = false,
  isPastWeek = false,
  isManualOverride = false,
  autoStars = stars,
  onUpdateMotivationalMessage,
  onSaveWeeklySettings,
}) => {
  const clampedStars = Math.max(0, Math.min(5, stars));
  const currentSubtitle = subtitle && subtitle.trim() ? subtitle : '';

  // Determine initial title: if provided use it, otherwise auto-select from current star tier
  const initialEffectiveTitle = useMemo(() => {
    if (title && title.trim().length > 0) return title.trim();
    return getDefaultMotivationalTitle(clampedStars, idPrefix);
  }, [title, clampedStars, idPrefix]);

  // Inline editing state for teacher mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialEffectiveTitle);
  const [editMessage, setEditMessage] = useState(currentSubtitle);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

  // Suggestions panel state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTierTab, setSelectedTierTab] = useState<'all' | StarTier>('all');

  // Manual Override state: disableAutoCalc = true means Manual mode (toggle starts in Manual position)
  const [disableAutoCalc, setDisableAutoCalc] = useState(isManualOverride);
  const [overrideStars, setOverrideStars] = useState<number>(clampedStars);

  const effectiveStars = disableAutoCalc ? overrideStars : clampedStars;
  const currentTier = getTierForStars(effectiveStars);

  useEffect(() => {
    setEditTitle(initialEffectiveTitle);
    setEditMessage(currentSubtitle);
    setDisableAutoCalc(isManualOverride);
    setOverrideStars(clampedStars);
    // If a title was passed in from saved data, treat as teacher-customized
    setIsTitleManuallyEdited(Boolean(title && title.trim().length > 0));
  }, [title, initialEffectiveTitle, currentSubtitle, isManualOverride, clampedStars]);

  // Filtered preset list for suggestions panel
  const filteredPresets = useMemo(() => {
    if (selectedTierTab === 'all') {
      return STAR_BAND_PRESETS;
    }
    return STAR_BAND_PRESETS.filter((p) => p.tier === selectedTierTab);
  }, [selectedTierTab]);

  const handleStarClick = (idx: number) => {
    let nextStars = idx;
    if (overrideStars === 0.5 && idx === 1) {
      nextStars = 0;
    } else if (overrideStars === idx) {
      nextStars = idx - 0.5;
    } else {
      nextStars = idx;
    }
    setOverrideStars(nextStars);

    // If teacher hasn't typed a custom title, automatically select a matching message from the new tier
    if (!isTitleManuallyEdited) {
      setEditTitle(getDefaultMotivationalTitle(nextStars, `${idPrefix}-${nextStars}`));
    }
  };

  const handleSaveEdit = () => {
    if (onSaveWeeklySettings) {
      onSaveWeeklySettings({
        message: editMessage.trim(),
        title: editTitle.trim(),
        manualStars: overrideStars,
        disableAuto: disableAutoCalc,
      });
    } else if (onUpdateMotivationalMessage) {
      onUpdateMotivationalMessage(editMessage.trim(), editTitle.trim());
    }
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(initialEffectiveTitle);
    setEditMessage(currentSubtitle);
    setDisableAutoCalc(isManualOverride);
    setOverrideStars(clampedStars);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  return (
    <div
      id={idPrefix}
      onClick={() => {
        if (isTeacherMode && !isEditing) {
          setIsEditing(true);
        }
      }}
      role={isTeacherMode && !isEditing ? 'button' : undefined}
      tabIndex={isTeacherMode && !isEditing ? 0 : undefined}
      onKeyDown={(e) => {
        if (isTeacherMode && !isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      className={`relative w-full my-2 sm:my-2.5 rounded-2xl sm:rounded-3xl px-3.5 py-2.5 sm:px-5 sm:py-3 select-none transition-all duration-200 overflow-visible border border-[#F8CB52]/60 shadow-[0_4px_16px_-4px_rgba(248,203,82,0.3)] backdrop-blur-[2px] ${
        isTeacherMode && !isEditing
          ? 'cursor-pointer hover:border-[#F8CB52] hover:shadow-[0_6px_20px_-4px_rgba(248,203,82,0.45)] hover:brightness-[1.02] active:scale-[0.99] active:brightness-95'
          : ''
      }`}
      style={{
        background:
          'linear-gradient(90deg, rgba(248, 203, 82, 0.5) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(248, 203, 82, 0.5) 100%)',
      }}
    >
      {isEditing ? (
        /* Teacher Inline Editor */
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex flex-col gap-3 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#F8CB52]/80 shadow-sm"
        >
          {/* Header Action Row */}
          <div className="flex items-center justify-between border-b border-[#F8CB52]/30 pb-2">
            <span className="text-xs font-bold text-[#8C6700] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9400]" />
              <span>Edit Weekly Star Band</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 text-[#8C6700]/70 hover:text-[#8C6700] hover:bg-[#8C6700]/10 rounded-full transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-[#8C6700] hover:bg-[#735400] text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Title Input & Suggestions */}
          <div className="text-left space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-[11px] text-[#8C6700] font-bold">
                Motivational Title:
              </label>

              {/* Suggestions toggle button */}
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-[10px] font-bold text-[#8C6700] hover:text-[#5E4500] bg-[#FAF6EE] hover:bg-[#F3EAD3] border border-[#F8CB52]/60 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-[#FF9400]" />
                <span>{showSuggestions ? 'Hide Presets' : 'Choose from 21 Presets'}</span>
                {showSuggestions ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Input field with quick auto-fill button */}
            <div className="relative">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setIsTitleManuallyEdited(true);
                }}
                placeholder="e.g. Amazing work this week! Keep shining! ⭐"
                className="w-full bg-[#FAF6EE] border border-[#F8CB52] rounded-xl px-3 py-2 text-xs text-[#8C6700] placeholder-[#8C6700]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C6700]/30 font-sans font-semibold pr-20"
              />
              <button
                type="button"
                onClick={() => {
                  const rec = getDefaultMotivationalTitle(
                    effectiveStars,
                    `${idPrefix}-${Date.now()}`
                  );
                  setEditTitle(rec);
                  setIsTitleManuallyEdited(false);
                }}
                title="Reset to recommended preset for current stars"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold text-[#8C6700] hover:text-[#5E4500] hover:bg-[#F8CB52]/25 rounded-md transition-colors cursor-pointer bg-white/70 border border-[#F8CB52]/40"
              >
                Auto-fill
              </button>
            </div>

            {/* Suggestions Panel: ~20 Presets grouped/filtered by tier */}
            {showSuggestions && (
              <div className="mt-2 p-2.5 bg-[#FAF6EE] border border-[#F8CB52]/60 rounded-xl space-y-2 animate-in fade-in duration-150 shadow-2xs">
                {/* Tier Filter Tabs */}
                <div className="flex items-center justify-between flex-wrap gap-1 border-b border-[#F8CB52]/30 pb-1.5">
                  <div className="flex items-center gap-1 flex-wrap text-[10px]">
                    <span className="text-[#8C6700] font-bold mr-0.5">Tiers:</span>
                    {(['all', 'high', 'mid', 'low'] as const).map((tierKey) => {
                      const isSelected = selectedTierTab === tierKey;
                      const isTierRecommended =
                        tierKey !== 'all' && tierKey === currentTier;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => setSelectedTierTab(tierKey)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#8C6700] text-white shadow-2xs'
                              : 'bg-white text-[#8C6700] border border-[#F8CB52]/40 hover:bg-[#F8CB52]/20'
                          }`}
                        >
                          <span>
                            {tierKey === 'all'
                              ? 'All (21)'
                              : tierKey === 'high'
                              ? 'High (4.5–5★)'
                              : tierKey === 'mid'
                              ? 'Mid (2.5–4★)'
                              : 'Low (0–2★)'}
                          </span>
                          {isTierRecommended && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#FF9400] ring-1 ring-white"
                              title="Recommended for current star rating"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[9.5px] text-[#8C6700]/80 italic">
                    Matching tier: {getTierLabel(currentTier)}
                  </span>
                </div>

                {/* Preset List */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredPresets.map((preset) => {
                    const isCurrent = editTitle === preset.text;
                    const tierBadgeText =
                      preset.tier === 'high'
                        ? '4.5–5★'
                        : preset.tier === 'mid'
                        ? '2.5–4★'
                        : '0–2★';

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditTitle(preset.text);
                          setIsTitleManuallyEdited(true);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#8C6700] text-white shadow-2xs'
                            : 'bg-white hover:bg-[#F3EAD3] text-[#1F2A3D] border border-[#F8CB52]/30'
                        }`}
                      >
                        <span className="truncate">{preset.text}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-white/20 text-white'
                              : preset.tier === 'high'
                              ? 'bg-[#23953F]/15 text-[#23953F]'
                              : preset.tier === 'mid'
                              ? 'bg-[#FA8400]/15 text-[#FA8400]'
                              : 'bg-[#0E5C56]/15 text-[#0E5C56]'
                          }`}
                        >
                          {tierBadgeText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Automatic Calculation Toggle */}
          <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#F8CB52]/40 space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8C6700]">Automatic</span>

              {/* Toggle switch for Automatic calculation */}
              <button
                type="button"
                role="switch"
                aria-checked={!disableAutoCalc}
                onClick={() => setDisableAutoCalc(!disableAutoCalc)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shadow-inner ${
                  !disableAutoCalc ? 'bg-[#FF9400] justify-end' : 'bg-[#D1D5DB] justify-start'
                }`}
                title="Toggle automatic calculation"
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* In Manual mode (Automatic is OFF): show interactive star rating selector */}
            {disableAutoCalc && (
              <div className="pt-2 border-t border-[#F8CB52]/20 flex justify-center items-center">
                {/* Clickable 5-star selector */}
                <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-[#F8CB52]/50 shadow-2xs">
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const isFull = overrideStars >= idx;
                    const isHalf = !isFull && overrideStars >= idx - 0.5;
                    const fillRatio = isFull ? 1 : isHalf ? 0.5 : 0;
                    return (
                      <button
                        key={`star-click-${idx}`}
                        type="button"
                        onClick={() => handleStarClick(idx)}
                        className="cursor-pointer transition-transform hover:scale-115 active:scale-95"
                        title={`Set to ${idx} stars (click again for half star)`}
                      >
                        <CrispStar fillRatio={fillRatio} className="w-6.5 h-6.5 sm:w-7 sm:h-7" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main Visual Display: Multiline title in modern sans-serif with natural vertical card expansion */
        <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4 w-full">
          {/* Left: Title without truncation (wraps and expands card height as needed) */}
          <div className="flex-1 min-w-[160px] py-0.5 pr-1">
            <h3 className="text-[14px] sm:text-[16px] md:text-[17px] font-normal tracking-tight text-[#8C6700] leading-snug font-sans break-words [overflow-wrap:anywhere]">
              {initialEffectiveTitle}
            </h3>
          </div>

          {/* Right: Stars with dedicated horizontal space (shrink-0, never overlapped) */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 shrink-0 select-none py-0.5 justify-end"
          >
            {[1, 2, 3, 4, 5].map((index) => {
              const isFull = clampedStars >= index;
              const isHalf = !isFull && clampedStars >= index - 0.5;
              const fillRatio = isFull ? 1 : isHalf ? 0.5 : 0;

              return (
                <CrispStar
                  key={index}
                  fillRatio={fillRatio}
                  className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 aspect-square shrink-0"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
