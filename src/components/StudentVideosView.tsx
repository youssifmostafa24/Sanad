import React from 'react';
import { Play, Video, BookOpen, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface StudentVideosViewProps {
  student: Student | null;
  isTeacherMode: boolean;
}

export const StudentVideosView: React.FC<StudentVideosViewProps> = ({
  student,
}) => {
  return (
    <div id="student-videos-view" className="space-y-3 w-full" dir="ltr">
      <div className="bg-white rounded-3xl border border-[#B8860B]/25 p-5 sm:p-6 shadow-xs text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1F5A4E]/10 border border-[#1F5A4E]/20 flex items-center justify-center text-[#1F5A4E] mx-auto mb-3.5 shadow-2xs">
          <Play className="w-7 h-7 text-[#1F5A4E] fill-[#1F5A4E]/20 ml-0.5" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[#1F2A3D]">
          {student?.name}'s Lessons & Videos
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6478] max-w-sm mx-auto mt-1.5 leading-relaxed">
          Watch guided recitation lessons, tajweed explanations, and revision videos recorded by your teacher.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-[#F5EFDD]/60 border border-[#B8860B]/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1F5A4E] shrink-0 shadow-2xs">
              <Video className="w-4 h-4 text-[#1F5A4E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F2A3D]">Daily Recitation Guide</h4>
              <p className="text-[11px] text-[#5B6478] mt-0.5">Listen and practice with teacher guidance</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5EFDD]/60 border border-[#B8860B]/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#B8860B] shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#B8860B]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F2A3D]">Tajweed Rules Review</h4>
              <p className="text-[11px] text-[#5B6478] mt-0.5">Key pronunciation and stopping signs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
