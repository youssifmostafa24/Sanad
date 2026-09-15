import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Family, Student, Entry, SurahMemorizationStatus } from './types';
import { getInitialData } from './data/seedData';
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
import { isTeacherAuthenticatedStored, setTeacherAuthenticatedStored } from './utils/authUtils';
import { normalizeQuranHomeworkText } from './data/quranSurahs';
import { BookOpen } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchAllDataFromSupabase,
  upsertEntryInSupabase,
  deleteEntryInSupabase,
  updateStudentSurahRatingsInSupabase,
  updateStudentTilawaInSupabase,
  updateStudentAttendanceInSupabase,
  updateFamilyAttendanceInSupabase,
  subscribeToSupabaseChanges,
} from './services/supabaseService';

const STORAGE_KEY = 'sanad_homework_data_v5';

export default function App() {
  // Load data from localStorage or seed
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

  // Save to localStorage on changes (always acts as robust local cache)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  // Supabase Real-time Cloud Synchronization
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    const loadFromSupabase = async () => {
      try {
        const remoteData = await fetchAllDataFromSupabase();
        if (remoteData && isMounted && remoteData.families.length > 0) {
          setData(remoteData);
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      }
    };

    loadFromSupabase();

    // Subscribe to realtime database changes from other clients/devices
    const unsubscribe = subscribeToSupabaseChanges(async () => {
      try {
        const remoteData = await fetchAllDataFromSupabase();
        if (remoteData && isMounted && remoteData.families.length > 0) {
          setData(remoteData);
        }
      } catch (err) {
        console.warn('Realtime fetch error:', err);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Read URL query parameter for family (?fam=<familyId>)
  const [activeFamilyId, setActiveFamilyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const famParam = params.get('fam');
    if (famParam && data.families.some((f) => f.id === famParam)) {
      return famParam;
    }
    return data.families[0]?.id || 'family-1';
  });

  // View state: 'portal' (Master 3-families landing portal) vs 'family' (individual family page)
  const [currentView, setCurrentView] = useState<'portal' | 'family'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fam') ? 'family' : 'portal';
  });

  // Persistent Teacher Authentication state (Password: 122333 / ١٢٢٣٣٣)
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return isTeacherAuthenticatedStored();
  });

  // Teacher mode active status
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);

  // Modals state
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

  // Slide-out sidebar drawer state for student pages navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Header auto-hide on scroll-down, show on scroll-up
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const lastScrollYRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeFamily = useMemo(() => {
    return data.families.find((f) => f.id === activeFamilyId) || data.families[0] || null;
  }, [data.families, activeFamilyId]);

  // Students available in current view
  const visibleStudents = useMemo(() => {
    if (!activeFamily) return data.students;
    const famStudents = data.students.filter((s) => activeFamily.studentIds.includes(s.id));
    return famStudents.length > 0 ? famStudents : data.students;
  }, [data.students, activeFamily]);

  // Active student state
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return visibleStudents[0]?.id || data.students[0]?.id || '';
  });

  // Ensure activeStudentId is valid whenever visibleStudents changes
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

  // Navigation from Portal to specific family & student
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

  // Return to Main Portal
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

  // Monthly Navigation State
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

  // Month navigation actions
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

  // Filter entries for the active student in the selected month
  // Per user requirement: When a new month begins with day 1, any days from the previous month
  // that belong to this opening week are transferred and displayed in the current month from the week's start,
  // so that the entire week is evaluated together with its weekly star band appearing right below it.
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

      // 1. If the week concludes (on Thursday) in this selected month, all days of this week
      // (including those starting in the previous month) belong to this month's view!
      if (weekEndMonthPrefix === selectedMonthPrefix) {
        return true;
      }

      // 2. If the entry's calendar date is in this selected month, but its week concludes in the next month:
      // - If the next month has NOT started yet, keep it in the current view so ongoing sessions can be graded.
      // - Once the next month starts, that week is transferred to the new month as requested.
      if (e.date.startsWith(selectedMonthPrefix) && !nextMonthHasStarted) {
        return true;
      }

      return false;
    });

    // Sort ASCENDING (first day of month to last)
    return filtered.sort((a, b) => {
      if (a.date === b.date) return (a.id || '').localeCompare(b.id || '');
      return a.date.localeCompare(b.date);
    });
  }, [activeStudent, selectedMonthPrefix, selectedYearMonth]);

  // Find the single most recent entry that still has ANY ungraded portion
  const mostRecentUngradedEntryId = useMemo(() => {
    if (!activeStudent) return null;
    const sortedAllDesc = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
    const found = sortedAllDesc.find((e) => e.hifzGrade === null || e.murajaaGrade === null);
    return found ? found.id : null;
  }, [activeStudent]);

  // Single most-recent entry currently in this month's view
  const singleMostRecentInViewId = useMemo(() => {
    if (monthEntries.length > 0) {
      return monthEntries[monthEntries.length - 1].id;
    }
    return null;
  }, [monthEntries]);

  // Scroll listener for header auto-hide/show
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

  // Entry mutation handlers
  const handleUpdateEntry = (updated: Entry) => {
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

    if (isSupabaseConfigured()) {
      upsertEntryInSupabase(activeStudent.id, updated).catch((err) =>
        console.error('Failed to sync updated entry to Supabase:', err)
      );
    }
  };

  const handleDeleteEntry = (entryId: string) => {
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

    if (isSupabaseConfigured()) {
      deleteEntryInSupabase(entryId).catch((err) =>
        console.error('Failed to delete entry from Supabase:', err)
      );
    }
  };

  const handleDuplicateEntry = (entry: Entry) => {
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
      hifzGrade: null, // Ungraded
      murajaaText: entry.murajaaText,
      murajaaGrade: null, // Ungraded
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

    if (isSupabaseConfigured()) {
      upsertEntryInSupabase(activeStudent.id, newEntry).catch((err) =>
        console.error('Failed to save duplicated entry to Supabase:', err)
      );
    }

    const [y, m] = nextDate.split('-').map(Number);
    setSelectedYearMonth({ year: y, month: m });
  };

  // Find the most recent entry of the current active student (for repeating last homework)
  const mostRecentStudentEntry = useMemo(() => {
    if (!activeStudent?.entries || activeStudent.entries.length === 0) return null;
    return [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [activeStudent]);

  // Handle repeating the last homework directly using the student's individual scheduled attendance days
  const handleRepeatLastHomework = (last: Entry | null) => {
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

    if (isSupabaseConfigured()) {
      upsertEntryInSupabase(activeStudent.id, newEntry).catch((err) =>
        console.error('Failed to save repeated entry to Supabase:', err)
      );
    }

    const [y, m] = targetDate.split('-').map(Number);
    setSelectedYearMonth({ year: y, month: m });
  };

  // Surah Memorization Status Update Handler
  const handleUpdateSurahStatus = (surahNumber: number, status: SurahMemorizationStatus) => {
    if (!activeStudent) return;
    const updatedRatings = {
      ...(activeStudent.surahRatings || {}),
      [surahNumber]: status,
    };

    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          surahRatings: updatedRatings,
        };
      });
      return { ...prev, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      updateStudentSurahRatingsInSupabase(activeStudent.id, updatedRatings).catch((err) =>
        console.error('Failed to update surah status in Supabase:', err)
      );
    }
  };

  // Direct Surah Memorization update for any selected student modal
  const handleModalUpdateSurahStatus = (studentId: string, surahNumber: number, status: SurahMemorizationStatus) => {
    const targetStudent = data.students.find((s) => s.id === studentId);
    const updatedRatings = {
      ...(targetStudent?.surahRatings || {}),
      [surahNumber]: status,
    };

    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          surahRatings: updatedRatings,
        };
      });
      return { ...prev, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      updateStudentSurahRatingsInSupabase(studentId, updatedRatings).catch((err) =>
        console.error('Failed to update modal surah status in Supabase:', err)
      );
    }
  };

  // Student Tilawa Surah & Ayah update handler
  const handleUpdateStudentTilawa = (studentId: string, surahNumber: number, ayahNumber: number) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, tilawaSurah: surahNumber, tilawaAyah: ayahNumber } : s
      );
      return { ...prev, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      updateStudentTilawaInSupabase(studentId, surahNumber, ayahNumber).catch((err) =>
        console.error('Failed to update student tilawa in Supabase:', err)
      );
    }
  };

  // Individual Student Attendance Schedule Save Handler
  const handleSaveStudentAttendance = (studentId: string, days: number[]) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, attendanceDays: days } : s
      );
      return { ...prev, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      updateStudentAttendanceInSupabase(studentId, days).catch((err) =>
        console.error('Failed to update student attendance in Supabase:', err)
      );
    }
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

    if (isSupabaseConfigured()) {
      Object.entries(updates).forEach(([stId, days]) => {
        updateStudentAttendanceInSupabase(stId, days).catch((err) =>
          console.error(`Failed to update attendance for ${stId} in Supabase:`, err)
        );
      });
    }
  };

  // Legacy/Family Attendance Schedule Save Handler (keeps students in sync if called)
  const handleSaveFamilyAttendance = (familyId: string, days: number[]) => {
    setData((prev) => {
      const updatedFamilies = prev.families.map((f) =>
        f.id === familyId ? { ...f, attendanceDays: days } : f
      );
      const targetFam = prev.families.find((f) => f.id === familyId);
      const updatedStudents = prev.students.map((s) => {
        if (targetFam?.studentIds.includes(s.id)) {
          return { ...s, attendanceDays: days };
        }
        return s;
      });
      return { ...prev, families: updatedFamilies, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      updateFamilyAttendanceInSupabase(familyId, days).catch((err) =>
        console.error('Failed to update family attendance in Supabase:', err)
      );
      const targetFam = data.families.find((f) => f.id === familyId);
      targetFam?.studentIds.forEach((stId) => {
        updateStudentAttendanceInSupabase(stId, days).catch((err) =>
          console.error(`Failed to update attendance for student ${stId} in Supabase:`, err)
        );
      });
    }
  };

  const handleResetData = () => {
    const initial = getInitialData();
    setData(initial);
    localStorage.removeItem(STORAGE_KEY);
    handleGoToCurrentMonth();
  };

  // If in portal view, render the 3-Family Master Portal
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
      className="w-full h-screen flex flex-col bg-[#F5EFDD] text-[#1F2A3D] font-sans overflow-hidden selection:bg-[#B8860B]/20"
      style={{
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(184, 134, 11, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(14, 92, 86, 0.05) 0%, transparent 40%)`,
      }}
    >
      {/* Auto-hiding Header */}
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

      {/* Main Content Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="main-scroll-view"
        className="flex-1 w-full overflow-y-auto pt-16 sm:pt-18 pb-16 sm:pb-20 px-1.5 sm:px-4 md:px-6"
      >
        <div className="w-full max-w-3xl sm:max-w-4xl mx-auto flex flex-col items-stretch space-y-2.5">
          {/* Month Navigator Bar */}
          <MonthNavigator
            isCurrent={isCurrentMonth}
            monthLabel={selectedMonthLabel}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToCurrentMonth={handleGoToCurrentMonth}
          />

          {/* List of Homework Entries for the selected month */}
          <div id="homework-list" className="space-y-1.5 pt-0.5">
            {monthEntries.length === 0 ? (
              <div
                id="empty-month-state"
                className="rounded-2xl border border-dashed border-[#B8860B]/25 bg-white p-5 text-center shadow-2xs"
              >
                <BookOpen className="w-7 h-7 mx-auto text-[#B8860B]/60 mb-1.5" />
                <h3 className="font-sans font-bold text-xs sm:text-sm text-[#0E5C56]">
                  لا توجد واجبات مسجلة لهذا الشهر
                </h3>
              </div>
            ) : (
              (() => {
                const isYusuf = Boolean(
                  activeStudent && (
                    activeStudent.id === 'student-yusuf' ||
                    activeStudent.name.toLowerCase().includes('yusuf') ||
                    activeStudent.arabicName?.includes('يوسف')
                  )
                );

                return monthEntries.map((entry, idx) => {
                  // Calculate week bounds for this entry
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
                        showOnTime={isYusuf}
                        onUpdateEntry={handleUpdateEntry}
                        onDeleteEntry={handleDeleteEntry}
                        onDuplicateEntry={handleDuplicateEntry}
                        onUpdateSurahStatus={handleUpdateSurahStatus}
                      />

                      {/* Weekly Star Band */}
                      {shouldShowStarBand && weekRating !== null && (
                        <WeeklyStarBand
                          key={`week-stars-${weekEndThursday}`}
                          stars={weekRating.stars}
                          idPrefix={`week-stars-${weekEndThursday}`}
                        />
                      )}
                    </React.Fragment>
                  );
                });
              })()
            )}

            {/* Teacher Mode: Single "Repeat +" Button as requested */}
            {isTeacherMode && (
              <AddHomeworkRow
                lastEntry={mostRecentStudentEntry}
                onRepeatLastEntry={handleRepeatLastHomework}
              />
            )}
          </div>
        </div>
      </main>

      {/* Fixed Compact Bottom Student Switcher */}
      <StudentSwitcher
        students={visibleStudents}
        activeStudentId={activeStudentId}
        onSelectStudent={setActiveStudentId}
      />

      {/* Slide-out Sidebar Drawer dedicated to Current Student */}
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

      {/* Student Attendance Settings Modal (Teacher Mode) */}
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

      {/* Student Surah Memorization Tracker Modal */}
      {selectedSurahStudent && (
        <SurahProgressModal
          isOpen={Boolean(selectedSurahStudent)}
          onClose={() => setSelectedSurahStudent(null)}
          student={selectedSurahStudent}
          isTeacherMode={isTeacherMode}
          onUpdateSurahStatus={(surahNumber, status) => {
            handleModalUpdateSurahStatus(selectedSurahStudent.id, surahNumber, status);
            // Also keep local state updated
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

      {/* Global Compact Offline & Supabase Status Indicator */}
      <OfflineIndicator isSupabaseConnected={isSupabaseConnected} />
    </div>
  );
}
