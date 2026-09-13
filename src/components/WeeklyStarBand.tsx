import React from 'react';
import { Star } from 'lucide-react';

interface WeeklyStarBandProps {
  stars: number; // 0 to 5
  idPrefix?: string;
}

export const WeeklyStarBand: React.FC<WeeklyStarBandProps> = ({ stars, idPrefix = 'weekly-star-band' }) => {
  const clampedStars = Math.max(0, Math.min(5, stars));

  return (
    <div
      id={idPrefix}
      className="w-full py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#F5C842] via-[#FBD466] to-[#F5C842] flex items-center justify-center shadow-xs my-1 select-none border border-[#EAB308]/30"
      title={`التقييم الأسبوعي: ${clampedStars} من 5 نجوم`}
    >
      {/* Light pill container matching the reference design */}
      <div
        className="bg-[#E5E9EE] px-4 sm:px-6 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-2xs"
        dir="ltr"
      >
        {[1, 2, 3, 4, 5].map((idx) => {
          if (clampedStars >= idx) {
            // Fully active star: fill + stroke
            return (
              <Star
                key={idx}
                size={22}
                fill="#FF7A00"
                stroke="#FF7A00"
                strokeWidth={2.2}
                className="shrink-0 transition-transform duration-150"
                aria-hidden="true"
              />
            );
          }

          if (clampedStars >= idx - 0.5) {
            // Half star: left half has fill, right half has stroke only
            return (
              <div
                key={idx}
                className="relative inline-flex items-center justify-center shrink-0 w-[22px] h-[22px] select-none"
              >
                {/* Base: Full star outline (stroke only, not faint) */}
                <Star
                  size={22}
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth={2.2}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {/* Overlay: Filled left half */}
                <div className="absolute top-0 left-0 bottom-0 overflow-hidden w-1/2 pointer-events-none">
                  <Star
                    size={22}
                    fill="#FF7A00"
                    stroke="#FF7A00"
                    strokeWidth={2.2}
                    className="shrink-0 max-w-none w-[22px] h-[22px]"
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          }

          // Inactive star: stroke only, 100% opacity, not faint
          return (
            <Star
              key={idx}
              size={22}
              fill="none"
              stroke="#FF7A00"
              strokeWidth={2.2}
              className="shrink-0 transition-transform duration-150"
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
};
