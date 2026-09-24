import React, { useState } from 'react';
import { Star, Edit3, Check, Sparkles, MessageCircle } from 'lucide-react';

interface WeeklyStarBandProps {
  stars: number; // 0 to 5 (or calculated)
  idPrefix?: string;
  title?: string; // e.g. "This week so far"
  subtitle?: string; // e.g. "Log every day to unlock the 5th star"
  isTeacherMode?: boolean;
  onUpdateMotivationalMessage?: (newMsg: string, newTitle?: string) => void;
}

export const WeeklyStarBand: React.FC<WeeklyStarBandProps> = ({
  stars,
  idPrefix = 'weekly-star-band',
  title = 'This week so far',
  subtitle,
  isTeacherMode = false,
  onUpdateMotivationalMessage,
}) => {
  const clampedStars = Math.max(0, Math.min(5, stars));

  // Determine dynamic subtitle if not provided
  const defaultSubtitle = (() => {
    if (clampedStars >= 5) {
      return 'ما شاء الله! حققت النجوم الخمس كاملة هذا الأسبوع ⭐';
    }
    if (clampedStars >= 4) {
      return 'Log every day to unlock the 5th star';
    }
    if (clampedStars >= 3) {
      return 'أداء رائع! ثابر وداوم على التسميع لفتح النجوم القادمة';
    }
    return 'سجل التسميع يومياً لفتح المزيد من النجوم المتألقة';
  })();

  const currentSubtitle = subtitle && subtitle.trim() ? subtitle : defaultSubtitle;

  // Inline editing state for teacher mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editMessage, setEditMessage] = useState(currentSubtitle);

  const handleSaveEdit = () => {
    if (onUpdateMotivationalMessage) {
      onUpdateMotivationalMessage(editMessage.trim(), editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      id={idPrefix}
      className="relative w-full my-2 rounded-[26px] sm:rounded-[32px] bg-gradient-to-r from-[#F98326] via-[#FB7B28] to-[#EE5D2A] text-white p-4 sm:p-5 shadow-md select-none transition-all duration-200 overflow-hidden border border-orange-400/30"
    >
      {/* Background subtle sheen effect */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />

      {isEditing ? (
        /* Teacher Inline Editor */
        <div className="relative z-10 flex flex-col gap-2.5 bg-black/20 p-3 rounded-2xl border border-white/20">
          <div className="flex items-center justify-between text-xs text-white/90 font-bold">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-yellow-300" />
              <span>تعديل رسالة التحفيز وعنوان بطاقة النجوم</span>
            </span>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py-1 bg-white text-[#EA580C] rounded-full text-xs font-bold hover:bg-yellow-100 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>حفظ الرسالة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-white/80 mb-0.5 font-medium">العنوان الرئيسي:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="This week so far"
                className="w-full bg-white/15 border border-white/30 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/50 focus:bg-white/25 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/80 mb-0.5 font-medium">الرسالة التحفيزية للطالب:</label>
              <input
                type="text"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Log every day to unlock the 5th star"
                className="w-full bg-white/15 border border-white/30 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/50 focus:bg-white/25 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Main Visual Display exactly matching the uploaded image */
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Left Text: Title + Motivational Subtitle */}
          <div className="flex-1 min-w-[200px] text-left" dir="ltr">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white drop-shadow-xs">
                {title || 'This week so far'}
              </h3>

              {isTeacherMode && onUpdateMotivationalMessage && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="تعديل الرسالة التحفيزية والعنوان"
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-white/95 font-medium mt-0.5 leading-snug drop-shadow-2xs">
              {currentSubtitle}
            </p>
          </div>

          {/* Right Stars: 5 crisp white/translucent stars matching user image */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 shrink-0 select-none py-1 px-1"
            dir="ltr"
            title={`التقييم: ${clampedStars} من 5 نجوم`}
          >
            {[1, 2, 3, 4, 5].map((index) => {
              const isFull = clampedStars >= index;
              const isHalf = !isFull && clampedStars >= index - 0.5;

              if (isFull) {
                // Fully solid bright white star
                return (
                  <Star
                    key={index}
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white drop-shadow-sm transition-transform duration-150"
                  />
                );
              }

              if (isHalf) {
                // Half-filled star
                return (
                  <div key={index} className="relative w-6 h-6 sm:w-7 sm:h-7">
                    <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white/35 fill-white/35" />
                    <div className="absolute top-0 left-0 bottom-0 overflow-hidden w-1/2">
                      <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
                    </div>
                  </div>
                );
              }

              // Faded / unreached star (soft translucent white matching 5th star in image)
              return (
                <Star
                  key={index}
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white/40 fill-white/40 transition-transform duration-150"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
