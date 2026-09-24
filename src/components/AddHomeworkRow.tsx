import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Check, X, Mic, Sparkles } from 'lucide-react';
import { Entry } from '../types';

interface AddHomeworkRowProps {
  lastEntry?: Entry | null;
  onRepeatLastEntry?: (lastEntry: Entry | null) => void;
  onOpenVoiceDictation?: () => void;
}

export const AddHomeworkRow: React.FC<AddHomeworkRowProps> = ({
  lastEntry,
  onRepeatLastEntry,
  onOpenVoiceDictation,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRepeatClick = () => {
    if (onRepeatLastEntry) {
      onRepeatLastEntry(lastEntry || null);
      setFeedback('تمت إضافة وتكرار الواجب لليوم التالي بنجاح');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div id="add-homework-section" className="w-full mt-2 pt-0.5">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="mb-2 px-3 py-1.5 rounded-2xl bg-[#0E5C56]/15 border border-[#0E5C56]/30 text-[#0E5C56] text-xs font-semibold flex items-center justify-between shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0E5C56] shrink-0 stroke-[2.5]" />
              <span>{feedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs text-[#5B6478] hover:text-[#1F2A3D] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row of Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="repeat-homework-btn"
          type="button"
          onClick={handleRepeatClick}
          dir="rtl"
          title="إضافة وتكرار الواجب تلقائياً في يوم الحضور التالي"
          className="flex-1 py-2.5 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-[#F6ECD2] text-[#0E5C56] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-2xs border border-[#B8860B]/20"
        >
          <RotateCcw className="w-4 h-4 text-[#0E5C56] shrink-0" />
          <Plus className="w-4 h-4 text-[#0E5C56] shrink-0" />
          <span>تكرار +</span>
        </button>

        {onOpenVoiceDictation && (
          <button
            id="voice-homework-btn"
            type="button"
            onClick={onOpenVoiceDictation}
            dir="rtl"
            title="إملاء صوتي ذكي للواجب بالذكاء الاصطناعي"
            className="flex-1 py-2.5 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#B8860B] to-[#976D07] hover:brightness-110 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
          >
            <Mic className="w-4 h-4 text-[#F1E7CE] shrink-0 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-[#F1E7CE] shrink-0" />
            <span>إملاء صوتي (AI)</span>
          </button>
        )}
      </div>
    </div>
  );
};
