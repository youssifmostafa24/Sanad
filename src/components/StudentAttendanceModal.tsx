import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Clock, User } from 'lucide-react';
import { Family, Student } from '../types';

export const WEEK_DAYS = [
  { id: 6, label: 'السبت', short: 'Sat' },
  { id: 0, label: 'الأحد', short: 'Sun' },
  { id: 1, label: 'الإثنين', short: 'Mon' },
  { id: 2, label: 'الثلاثاء', short: 'Tue' },
  { id: 3, label: 'الأربعاء', short: 'Wed' },
  { id: 4, label: 'الخميس', short: 'Thu' },
  { id: 5, label: 'الجمعة', short: 'Fri' },
];

export function getAttendanceDaysSummary(days?: number[]): string {
  if (!days || days.length === 0) return 'غير محدد';
  const labels = days.map((d) => WEEK_DAYS.find((w) => w.id === d)?.label).filter(Boolean);
  return labels.join('، ');
}

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Family;
  students: Student[];
  initialStudentId?: string;
  onSaveStudentDays: (studentId: string, attendanceDays: number[]) => void;
  onSaveAllStudentsDays?: (updates: Record<string, number[]>) => void;
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  isOpen,
  onClose,
  family,
  students,
  initialStudentId,
  onSaveStudentDays,
  onSaveAllStudentsDays,
}) => {
  // Family students only
  const familyStudents = students.filter((s) => family.studentIds.includes(s.id));

  // Current selected student tab
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && familyStudents.some((s) => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return familyStudents[0]?.id || '';
  });

  // Local state map: studentId -> number[]
  const [attendanceMap, setAttendanceMap] = useState<Record<string, number[]>>({});

  // Sync state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, number[]> = {};
      familyStudents.forEach((st) => {
        initialMap[st.id] = st.attendanceDays && st.attendanceDays.length > 0
          ? [...st.attendanceDays]
          : [1, 5]; // Default Mon & Fri
      });
      setAttendanceMap(initialMap);

      if (initialStudentId && familyStudents.some((s) => s.id === initialStudentId)) {
        setSelectedStudentId(initialStudentId);
      } else if (!selectedStudentId && familyStudents.length > 0) {
        setSelectedStudentId(familyStudents[0].id);
      }
    }
  }, [isOpen, initialStudentId, students]);

  if (!isOpen) return null;

  const currentStudent = familyStudents.find((s) => s.id === selectedStudentId) || familyStudents[0];
  const currentDays = (currentStudent && attendanceMap[currentStudent.id]) || [1, 5];

  const toggleDayForCurrentStudent = (dayId: number) => {
    if (!currentStudent) return;
    const currentList = attendanceMap[currentStudent.id] || [];
    const updated = currentList.includes(dayId)
      ? currentList.filter((d) => d !== dayId)
      : [...currentList, dayId].sort();

    setAttendanceMap((prev) => ({
      ...prev,
      [currentStudent.id]: updated,
    }));
  };

  const applyPreset = (presetDays: number[]) => {
    if (!currentStudent) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [currentStudent.id]: [...presetDays].sort(),
    }));
  };

  const handleSave = () => {
    if (onSaveAllStudentsDays) {
      onSaveAllStudentsDays(attendanceMap);
    } else {
      Object.entries(attendanceMap).forEach(([studentId, days]) => {
        onSaveStudentDays(studentId, days);
      });
    }
    onClose();
  };

  return (
    <div
      id="student-attendance-overlay"
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="student-attendance-modal"
        className="w-full max-w-lg bg-[#FAF6EE] text-[#1F2A3D] rounded-2xl shadow-2xl border border-[#B8860B]/30 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0E5C56] text-[#F1E7CE] flex items-center justify-between border-b border-[#B8860B]/40 select-none shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#B8860B]" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1E7CE]">
                إعدادات أيام الحضور الخاصة بالطلاب
              </h2>
              <p className="text-[11px] text-[#F1E7CE]/80">
                لكل ولد أيامه المستقلة وجدول تسميعه الخاص — {family.name}
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

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Student Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-[#0E5C56] mb-2">
              اختر الطالب لتحديد أيامه الخاصة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {familyStudents.map((st) => {
                const isSelected = st.id === selectedStudentId;
                const daysForSt = attendanceMap[st.id] || st.attendanceDays || [1, 5];
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 relative ${
                      isSelected
                        ? 'bg-[#0E5C56] text-[#F1E7CE] border-[#0E5C56] shadow-md ring-2 ring-[#B8860B]/50'
                        : 'bg-white hover:bg-[#FBF6E8] text-[#1F2A3D] border-[#B8860B]/25 hover:border-[#B8860B]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 border border-white/40"
                          style={{ backgroundColor: st.color || '#0E5C56' }}
                        >
                          {st.name.charAt(0)}
                        </span>
                        <span className="font-bold text-xs truncate max-w-[85px]">
                          {st.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#B8860B] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    {st.arabicName && (
                      <span className={`text-[10px] ${isSelected ? 'text-[#F1E7CE]/90' : 'text-[#5B6478]'}`}>
                        ({st.arabicName})
                      </span>
                    )}
                    <span className={`text-[9.5px] font-mono mt-0.5 truncate ${isSelected ? 'text-[#E6CA65]' : 'text-[#0E5C56]'}`}>
                      {daysForSt.length} أيام: {getAttendanceDaysSummary(daysForSt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Student Details Card */}
          {currentStudent && (
            <div className="bg-white rounded-xl p-3.5 border border-[#B8860B]/25 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#B8860B]/15">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: currentStudent.color || '#0E5C56' }}
                  >
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0E5C56]">
                      أيام حضور: {currentStudent.name} {currentStudent.arabicName && `(${currentStudent.arabicName})`}
                    </h3>
                    <p className="text-[10.5px] text-[#5B6478]">
                      عند النقر على &quot;تكرار +&quot;، سينتقل الواجب إلى يوم الحضور التالي الخاص بهذا الطالب.
                    </p>
                  </div>
                </div>
              </div>

              {/* Days Grid */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F2A3D]">
                  حدد أيام الأسبوع للطالب ({currentStudent.name}):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = currentDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDayForCurrentStudent(day.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E5C56] text-[#F1E7CE] border-[#0E5C56] shadow-xs'
                            : 'bg-[#FBF6E8]/70 text-[#5B6478] hover:bg-[#FBF6E8] border-[#B8860B]/20'
                        }`}
                      >
                        <span>{day.label}</span>
                        <span className="text-[10px] opacity-75 font-mono">{day.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-[#5B6478] block">
                  نماذج سريعة:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset([1, 5])}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] font-medium transition-colors cursor-pointer"
                  >
                    الإثنين والجمعة
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([0, 2, 4])}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] font-medium transition-colors cursor-pointer"
                  >
                    الأحد، الثلاثاء، الخميس
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([6, 1, 3])}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] font-medium transition-colors cursor-pointer"
                  >
                    السبت، الإثنين، الأربعاء
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([6, 0, 1, 2, 3, 4])}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FBF6E8] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] font-medium transition-colors cursor-pointer"
                  >
                    يومي (السبت - الخميس)
                  </button>
                </div>
              </div>

              {/* Current Selection summary */}
              <div className="p-2.5 bg-[#FBF6E8] rounded-xl border border-[#B8860B]/20 flex items-start gap-2 text-xs text-[#5B6478]">
                <Clock className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  جدول <b>{currentStudent.name}</b>:{' '}
                  <b className="text-[#0E5C56]">
                    {currentDays.length === 0
                      ? 'لم يتم تحديد أي يوم'
                      : getAttendanceDaysSummary(currentDays)}
                  </b>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#F1E7CE]/60 border-t border-[#B8860B]/20 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#5B6478]">
            يتم حفظ أيام كل طالب على حدة
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 border border-gray-300 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
