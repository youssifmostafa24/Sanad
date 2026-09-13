import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Family, Student, Entry, SurahMemorizationStatus } from './types';
import { getInitialData } from './data/seedData';
import { supabase } from './lib/supabase';
import {
  formatLocalDate,
  parseLocalDate,
  getWeekBounds,
  addDays,
  getNextAttendanceDate,
  getWeeklyStarRating,
} from './utils/dateUtils';
import { Header } from './components/Header';
import { HomeworkRow } from './components/HomeworkRow';
import { AddHomeworkRow } from './components/AddHomeworkRow';
import { WeeklyStarBand } from './components/WeeklyStarBand';
import { StudentSwitcher } from './components/StudentSwitcher';
import { StudentSidebarDrawer } from './components/StudentSidebarDrawer';
import { MonthNavigator } from './components/WeekNavigator';
import { MainPortal } from './components/MainPortal';
import { StudentAttendanceModal } from './components/StudentAttendanceModal';
import { SurahProgressModal } from './components/SurahProgressModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  isTeacherAuthenticatedStored,
  setTeacherAuthenticatedStored,
} from './utils/authUtils';
import { normalizeQuranHomeworkText } from './data/quranSurahs';
import { BookOpen } from 'lucide-react';

const STORAGE_KEY = 'sanad_homework_data_v5';

export default function App() {
  const [data, setData] = useState<{ families: Family[]; students: Student[] }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.families?.length >= 3 && parsed?.students?.length >= 8) {
          const normalizedStudents = parsed.students.map((st: Student) => ({
            ...st,
            entries: (st.entries || []).map((e: Entry) => ({
              ...e,
              hifzText: normalizeQuranHomeworkText(e.hifzText),
              murajaaText: normalizeQuranHomeworkText(e.murajaaText),
            })),
          }));
          return { families: parsed.families, students: normalizedStudents };
        }
      }
    } catch {
      // ignore
    }
    return getInitialData();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const [activeFamilyId, setActiveFamilyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const famParam = params.get('fam');
    if (famParam && data.families.some((f) => f.id === famParam)) {
      return famParam;
    }
    return data.families[0]?.id || 'family-1';
  });

  const [currentView, setCurrentView] = useState<'portal' | 'family'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fam') ? 'family' : 'portal';
  });

  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return isTeacherAuthenticatedStored();
  });

  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);

  const [isFamilyAttendanceOpen, setIsFamilyAttendanceOpen] = useState<boolean>(false);
  const [attendanceModalStudentId, setAttendanceModalStudentId] = useState<string | null>(null);
  const [selectedSurahStudent, setSelectedSurahStudent] = useState<Student | null>(null);

  const handleTeacherLoginSuccess = () => {
    setIsTeacherAuthenticated(true);
    setTeacherAuthenticatedStored(true);
  };

  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    setIsTeacherMode(false);
    setTeacherAuthenticatedStored(false);
  };

  const handleToggleTeacherMode = () => {
    setIsTeacherMode((prev) => !prev);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const lastScrollYRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeFamily = useMemo(() => {
    return data.families.find((f) => f.id === activeFamilyId) || data.families[0] || null;
  }, [data.families, activeFamilyId]);

  const visibleStudents = useMemo(() => {
    if (!activeFamily) return data.students;
    const famStudents = data.students.filter((s) => activeFamily.studentIds.includes(s.id));
    return famStudents.length > 0 ? famStudents : data.students;
  }, [data.students, activeFamily]);

  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return visibleStudents[0]?.id || data.students[0]?.id || '';
  });

  useEffect(() => {
    if (!visibleStudents.some((s) => s.id === activeStudentId)) {
      if (visibleStudents[0]) {
        setActiveStudentId(visibleStudents[0].id);
      }
    }
  }, [visibleStudents, activeStudentId]);

  const activeStudent = useMemo(() => {
    return data.students.find((s) => s.id === activeStudentId) || data.students[0] || null;
  }, [data.students, activeStudentId]);

  const handleSelectFamilyAndStudent = (familyId: string, studentId?: string) => {
    setActiveFamilyId(familyId);
    if (studentId) {
      setActiveStudentId(studentId);
    } else {
      const targetFam = data.families.find((f) => f.id === familyId);
      if (targetFam && targetFam.studentIds.length > 0) {
        setActiveStudentId(targetFam.studentIds[0]);
      }
    }
    setCurrentView('family');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('fam', familyId);
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const handleOpenPortal = () => {
    setCurrentView('portal');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('fam');
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const now = new Date();
  const [selectedYearMonth, setSelectedYearMonth] = useState<{ year: number; month: number }>(() => ({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }));

  const isCurrentMonth = useMemo(() => {
    const n = new Date();
    return selectedYearMonth.year === n.getFullYear() && selectedYearMonth.month === n.getMonth() + 1;
  }, [selectedYearMonth]);

  const selectedMonthPrefix = useMemo(() => {
    return `${selectedYearMonth.year}-${String(selectedYearMonth.month).padStart(2, '0')}`;
  }, [selectedYearMonth]);

  const selectedMonthLabel = useMemo(() => {
    const date = new Date(selectedYearMonth.year, selectedYearMonth.month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedYearMonth]);

  const handlePrevMonth = () => {
    setSelectedYearMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedYearMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleGoToCurrentMonth = () => {
    const n = new Date();
    setSelectedYearMonth({ year: n.getFullYear(), month: n.getMonth() + 1 });
  };

  const monthEntries = useMemo(() => {
    if (!activeStudent?.entries) return [];

    const nextMonthYear = selectedYearMonth.month === 12 ? selectedYearMonth.year + 1 : selectedYearMonth.year;
    const nextMonthNum = selectedYearMonth.month === 12 ? 1 : selectedYearMonth.month + 1;
    const nextMonthPrefix = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}`;
    const nextMonthStartStr = `${nextMonthPrefix}-01`;
    const todayStr = formatLocalDate(new Date());
    const nextMonthHasStarted = todayStr >= nextMonthStartStr;

    const filtered = activeStudent.entries.filter((e) => {
      const weekBounds = getWeekBounds(parseLocalDate(e.date));
      const weekEndMonthPrefix = weekBounds.endStr.slice(0, 7);

      if (weekEndMonthPrefix === selectedMonthPrefix) {
        return true;
      }

      if (e.date.startsWith(selectedMonthPrefix) && !nextMonthHasStarted) {
        return true;
      }

      return false;
    });

    return filtered.sort((a, b) => {
      if (a.date === b.date) return (a.id || '').localeCompare(b.id || '');
      return a.date.localeCompare(b.date);
    });
  }, [activeStudent, selectedMonthPrefix, selectedYearMonth]);

  const mostRecentUngradedEntryId = useMemo(() => {
    if (!activeStudent) return null;
    const sortedAllDesc = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
    const found = sortedAllDesc.find((e) => e.hifzGrade === null || e.murajaaGrade === null);
    return found ? found.id : null;
  }, [activeStudent]);

  const singleMostRecentInViewId = useMemo(() => {
    if (monthEntries.length > 0) {
      return monthEntries[monthEntries.length - 1].id;
    }
    return null;
  }, [monthEntries]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentY = scrollContainerRef.current.scrollTop;
    const prevY = lastScrollYRef.current;

    if (currentY <= 40) {
      setHeaderVisible(true);
    } else if (currentY > prevY + 10) {
      setHeaderVisible(false);
    } else if (currentY < prevY - 8) {
      setHeaderVisible(true);
    }

    lastScrollYRef.current = currentY;
  };

  const handleUpdateEntry = async (updated: Entry) => {
    if (!activeStudent) return;
    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          entries: s.entries.map((e) => (e.id === updated.id ? updated : e)),
        };
      });
      return { ...prev, students: updatedStudents };
    });

    try {
      await supabase
        .from('quran_records')
        .upsert({
          student_id: activeStudent.id,
          surah_name: updated.hifzText || updated.murajaaText || 'تسميع',
          rating: String(updated.hifzGrade ?? updated.murajaaGrade ?? '100'),
        });
    } catch (err) {
      console.error('خطأ في إرسال التعديل لـ Supabase:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!activeStudent) return;
    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          entries: s.entries.filter((e) => e.id !== entryId),
        };
      });
      return { ...prev, students: updatedStudents };
    });
  };

  const handleDuplicateEntry = async (entry: Entry) => {
    if (!activeStudent) return;
    const attendanceSchedule =
      activeStudent.attendanceDays && activeStudent.attendanceDays.length > 0
        ? activeStudent.attendanceDays
        : activeFamily?.attendanceDays || [1, 5];
    const nextDate = getNextAttendanceDate(entry.date, attendanceSchedule);

    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      date: nextDate,
      hifzText: entry.hifzText,
      hifzGrade: null,
      murajaaText: entry.murajaaText,
      murajaaGrade: null,
    };

    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          entries: [newEntry, ...s.entries],
        };
      });
      return { ...prev, students: updatedStudents };
    });

    try {
      await supabase.from('quran_records').insert([
        {
          student_id: activeStudent.id,
          surah_name: entry.hifzText || entry.murajaaText || 'تسميع مكرر',
          rating: 'لم يقيم بعد',
        },
      ]);
    } catch (err) {
      console.error('خطأ في إرسال الواجب المكرر لـ Supabase:', err);
    }

    const [y, m] = nextDate.split('-').map(Number);
    setSelectedYearMonth({ year: y, month: m });
  };

  const mostRecentStudentEntry = useMemo(() => {
    if (!activeStudent?.entries || activeStudent.entries.length === 0) return null;
    return [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [activeStudent]);

  const handleRepeatLastHomework = async (last: Entry | null) => {
    if (!activeStudent) return;
    const todayStr = formatLocalDate(new Date());
    const attendanceSchedule =
      activeStudent.attendanceDays && activeStudent.attendanceDays.length > 0
        ? activeStudent.attendanceDays
        : activeFamily?.attendanceDays || [1, 5];
    const targetDate = last
      ? getNextAttendanceDate(last.date, attendanceSchedule)
      : getNextAttendanceDate(todayStr, attendanceSchedule);

    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      date: targetDate,
      hifzText: last ? last.hifzText : '',
      hifzGrade: null,
      murajaaText: last ? last.murajaaText : '',
      murajaaGrade: null,
    };

    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          entries: [newEntry, ...s.entries],
        };
      });
      return { ...prev, students: updatedStudents };
    });

    try {
      await supabase.from('quran_records').insert([
        {
          student_id: activeStudent.id,
          surah_name: last?.hifzText || last?.murajaaText || 'واجب جديد',
          rating: '100',
        },
      ]);
    } catch (err) {
      console.error('خطأ في حفظ الواجب في Supabase:', err);
    }

    const [y, m] = targetDate.split('-').map(Number);
    setSelectedYearMonth({ year: y, month: m });
  };

  const handleUpdateSurahStatus = (surahNumber: number, status: SurahMemorizationStatus) => {
    if (!activeStudent) return;
    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          surahRatings: {
            ...(s.surahRatings || {}),
            [surahNumber]: status,
          },
        };
      });
      return { ...prev, students: updatedStudents };
    });
  };

  const handleModalUpdateSurahStatus = (studentId: string, surahNumber: number, status: SurahMemorizationStatus) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          surahRatings: {
            ...(s.surahRatings || {}),
            [surahNumber]: status,
          },
        };
      });
      return { ...prev, students: updatedStudents };
    });
  };

  const handleUpdateStudentTilawa = (studentId: string, surahNumber: number, ayahNumber: number) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, tilawaSurah: surahNumber, tilawaAyah: ayahNumber } : s
      );
      return { ...prev, students: updatedStudents };
    });
  };

  const handleSaveStudentAttendance = (studentId: string, days: number[]) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, attendanceDays: days } : s
      );
      return { ...prev, students: updatedStudents };
    });
  };

  const handleSaveAllStudentsAttendance = (updates: Record<string, number[]>) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (updates[s.id]) {
          return { ...s, attendanceDays: updates[s.id] };
        }
        return s;
      });
      return { ...prev, students: updatedStudents };
    });
  };

  const handleResetData = () => {
    const initial = getInitialData();
    setData(initial);
    localStorage.removeItem(STORAGE_KEY);
    handleGoToCurrentMonth();
  };

  if (currentView === 'portal') {
    return (
      <MainPortal
        families={data.families}
        students={data.students}
        onSelectFamilyAndStudent={handleSelectFamilyAndStudent}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
        onTeacherLogout={handleTeacherLogout}
        isTeacherMode={isTeacherMode}
        onToggleTeacherMode={handleToggleTeacherMode}
      />
    );
  }

  return (
    <div
      id="sanad-app-root"
      className="w-full h-screen flex flex-col bg-[#F1E7CE] text-[#1F2A3D] font-sans overflow-hidden selection:bg-[#B8860B]/20"
      style={{
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(184, 134, 11, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(14, 92, 86, 0.05) 0%, transparent 40%)`,
      }}
    >
      <Header
        isTeacherMode={isTeacherMode}
        activeFamily={activeFamily}
        onEnterTeacherMode={() => setIsTeacherMode(true)}
        onExitTeacherMode={() => setIsTeacherMode(false)}
        onResetData={handleResetData}
        visible={headerVisible}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        activeStudentName={activeStudent?.name}
        onOpenPortal={handleOpenPortal}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
      />

      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="main-scroll-view"
        className="flex-1 w-full overflow-y-auto pt-16 sm:pt-18 pb-16 sm:pb-20 px-1.5 sm:px-4 md:px-6"
      >
        <div className="w-full max-w-3xl sm:max-w-4xl mx-auto flex flex-col items-stretch space-y-2.5">
          <MonthNavigator
            isCurrent={isCurrentMonth}
            monthLabel={selectedMonthLabel}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToCurrentMonth={handleGoToCurrentMonth}
          />

          <div id="homework-list" className="space-y-1.5 pt-0.5">
            {monthEntries.length === 0 ? (
              <div
                id="empty-month-state"
                className="rounded-xl border border-dashed border-[#B8860B]/25 bg-[#FBF6E8] p-5 text-center shadow-2xs"
              >
                <BookOpen className="w-7 h-7 mx-auto text-[#B8860B]/60 mb-1.5" />
                <h3 className="font-sans font-bold text-xs sm:text-sm text-[#0E5C56]">
                  لا توجد واجبات مسجلة لهذا الشهر
                </h3>
              </div>
            ) : (
              monthEntries.map((entry, idx) => {
                const weekBounds = getWeekBounds(parseLocalDate(entry.date));
                const weekEndThursday = weekBounds.endStr;
                const nextSaturdayStr = addDays(weekEndThursday, 2);

                const weekEndMonthPrefix = weekEndThursday.slice(0, 7);
                const isWeekEndingInCurrentMonth = weekEndMonthPrefix === selectedMonthPrefix;

                const nextEntry = monthEntries[idx + 1];
                const isLastEntryOfWeekInMonth =
                  !nextEntry ||
                  getWeekBounds(parseLocalDate(nextEntry.date)).endStr !== weekEndThursday;

                const hasSubsequentSaturdayEntry = Boolean(
                  activeStudent?.entries?.some((e) => e.date >= nextSaturdayStr)
                );

                const shouldShowStarBand =
                  isWeekEndingInCurrentMonth &&
                  isLastEntryOfWeekInMonth &&
                  hasSubsequentSaturdayEntry;

                const weekRating =
                  shouldShowStarBand && activeStudent
                    ? getWeeklyStarRating(
                        weekEndThursday,
                        activeStudent.entries,
                        activeStudent.manualWeeklyStars,
                        new Date()
                      )
                    : null;

                return (
                  <React.Fragment key={`entry-group-${entry.id}`}>
                    <HomeworkRow
                      key={`month-entry-${entry.id}`}
                      entry={entry}
                      isTeacherMode={isTeacherMode}
                      isMostRecentUngraded={entry.id === mostRecentUngradedEntryId}
                      isSingleMostRecentInView={entry.id === singleMostRecentInViewId}
                      selectedMonthPrefix={selectedMonthPrefix}
                      studentSurahRatings={activeStudent?.surahRatings}
                      onUpdateEntry={handleUpdateEntry}
                      onDeleteEntry={handleDeleteEntry}
                      onDuplicateEntry={handleDuplicateEntry}
                      onUpdateSurahStatus={handleUpdateSurahStatus}
                    />

                    {shouldShowStarBand && weekRating !== null && (
                      <WeeklyStarBand
                        key={`week-stars-${weekEndThursday}`}
                        stars={weekRating.stars}
                        idPrefix={`week-stars-${weekEndThursday}`}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}

            {isTeacherMode && (
              <AddHomeworkRow
                lastEntry={mostRecentStudentEntry}
                onRepeatLastEntry={handleRepeatLastHomework}
              />
            )}
          </div>
        </div>
      </main>

      <StudentSwitcher
        students={visibleStudents}
        activeStudentId={activeStudentId}
        onSelectStudent={setActiveStudentId}
      />

      <StudentSidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        student={activeStudent}
        familyName={activeFamily?.name}
        familyId={activeFamily?.id}
        isTeacherMode={isTeacherMode}
        onUpdateStudentTilawa={handleUpdateStudentTilawa}
        onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
        onOpenSurahProgress={(st) => setSelectedSurahStudent(st)}
        onOpenPortal={handleOpenPortal}
      />

      {activeFamily && (
        <StudentAttendanceModal
          isOpen={isFamilyAttendanceOpen}
          onClose={() => {
            setIsFamilyAttendanceOpen(false);
            setAttendanceModalStudentId(null);
          }}
          family={activeFamily}
          students={data.students}
          initialStudentId={attendanceModalStudentId || activeStudentId}
          onSaveStudentDays={handleSaveStudentAttendance}
          onSaveAllStudentsDays={handleSaveAllStudentsAttendance}
        />
      )}

      {selectedSurahStudent && (
        <SurahProgressModal
          isOpen={Boolean(selectedSurahStudent)}
          onClose={() => setSelectedSurahStudent(null)}
          student={selectedSurahStudent}
          isTeacherMode={isTeacherMode}
          onUpdateSurahStatus={(surahNumber, status) => {
            handleModalUpdateSurahStatus(selectedSurahStudent.id, surahNumber, status);
            setSelectedSurahStudent((prev) =>
              prev
                ? {
                    ...prev,
                    surahRatings: {
                      ...(prev.surahRatings || {}),
                      [surahNumber]: status,
                    },
                  }
                : null
            );
          }}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
