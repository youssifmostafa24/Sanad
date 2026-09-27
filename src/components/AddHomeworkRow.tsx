import React from 'react';
import { Plus } from 'lucide-react';
import { Entry } from '../types';

interface AddHomeworkRowProps {
  lastEntry?: Entry | null;
  onRepeatLastEntry?: (lastEntry: Entry | null) => void;
  onOpenVoiceDictation?: () => void;
}

export const AddHomeworkRow: React.FC<AddHomeworkRowProps> = ({
  lastEntry,
  onRepeatLastEntry,
}) => {
  const handleRepeatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRepeatLastEntry) {
      onRepeatLastEntry(lastEntry || null);
    }
  };

  return (
    <div id="add-homework-section" className="w-full mt-2.5 pt-1" dir="rtl">
      {/* Minimal Icon-Only "+" Repeat Homework Button */}
      <div className="flex justify-center items-center py-1">
        <button
          id="repeat-homework-btn"
          type="button"
          onClick={handleRepeatClick}
          aria-label="تكرار الواجب للحصة القادمة"
          title="تكرار الواجب للحصة القادمة"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-[#F6ECD2] text-[#0E5C56] hover:text-[#0A4540] border-2 border-[#B8860B]/35 hover:border-[#B8860B] shadow-2xs hover:shadow-xs flex items-center justify-center active:scale-90 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
