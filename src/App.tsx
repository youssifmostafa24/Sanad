import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Family, Student, Entry, SurahMemorizationStatus, GradeValue } from './types';
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
import { StudentSettingsModal } from './components/StudentSettingsModal';
import { StudentFocusNotesModal } from './components/StudentFocusNotesModal';
import { VoiceHomeworkModal } from './components/VoiceHomeworkModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { isTeacherAuthenticatedStored, setTeacherAuthenticatedStored } from './utils/authUtils';
import { normalizeQuranHomeworkText } from './data/quranSurahs';
import { BookOpen, ArrowDown, ChevronRight } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchAllDataFromSupabase,
  upsertEntryInSupabase,
  deleteEntryInSupabase,
  updateStudentSurahRatingsInSupabase,
  updateStudentTilawaInSupabase,
  updateStudentAttendanceInSupabase,
  updateFamilyAttendanceInSupabase,
  updateStudentPhotoInSupabase,
  updateStudentFocusInSupabase,
  subscribeToSupabaseChanges,
  syncAllLocalDataToSupabase,
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
          // Sanitize families: exclude any 4th family (e.g. Mostafa/Samah)
          const filteredFamilies = parsed.families
            .filter((fam: Family) => {
              const n = fam.name.toLowerCase();
              return (
                !n.includes('mostafa') &&
                !n.includes('samah') &&
                !n.includes('مصطفى') &&
                !n.includes('مصطفي') &&
                !n.includes('سماح')
              );
            })
            .slice(0, 3)
            .map((fam: Family) => {
              if (fam.id === 'family-3') {
                return {
                  ...fam,
                  name: 'Hayaa + Yusuf',
                  studentIds: ['student-hayaa', 'student-yusuf'],
                };
              }
              return fam;
            });

          const normalizedStudents = parsed.students.map((st: Student) => ({
            ...st,
            entries: (st.entries || []).map((e: Entry) => ({
              ...e,
              hifzText: normalizeQuranHomeworkText(e.hifzText),
              murajaaText: normalizeQuranHomeworkText(e.murajaaText),
            })),
          }));
          return { families: filteredFamilies, students: normalizedStudents };
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
          // Merge remote data with existing data:
          // If a student in remoteData has 0 entries but exists in local data with entries (like Ibrahim, Sulaymn, Yusuf),
          // preserve those entries so they never disappear!
          setData((prev) => {
            const mergedStudents = remoteData.students.map((remoteSt) => {
              const localSt = prev.students.find((s) => s.id === remoteSt.id);
              if (remoteSt.entries && remoteSt.entries.length > 0) {
                // Remote has entries, use them (or merge unique by id/date)
                if (localSt && localSt.entries && localSt.entries.length > 0) {
                  const entryIds = new Set(remoteSt.entries.map((e) => e.id));
                  const missingFromRemote = localSt.entries.filter((e) => !entryIds.has(e.id));
                  return {
                    ...remoteSt,
                    entries: [...remoteSt.entries, ...missingFromRemote].sort((a, b) => b.date.localeCompare(a.date)),
                  };
                }
                return remoteSt;
              }
              // If remote has 0 entries, keep local entries
              if (localSt && localSt.entries && localSt.entries.length > 0) {
                return {
                  ...remoteSt,
                  entries: localSt.entries,
                };
              }
              return remoteSt;
            });

            return {
              families: remoteData.families,
              students: mergedStudents,
            };
          });
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
          setData((prev) => {
            const mergedStudents = remoteData.students.map((remoteSt) => {
              const localSt = prev.students.find((s) => s.id === remoteSt.id);
              if (remoteSt.entries && remoteSt.entries.length > 0) {
                if (localSt && localSt.entries && localSt.entries.length > 0) {
                  const entryIds = new Set(remoteSt.entries.map((e) => e.id));
                  const missingFromRemote = localSt.entries.filter((e) => !entryIds.has(e.id));
                  return {
                    ...remoteSt,
                    entries: [...remoteSt.entries, ...missingFromRemote].sort((a, b) => b.date.localeCompare(a.date)),
                  };
                }
                return remoteSt;
              }
              if (localSt && localSt.entries && localSt.entries.length > 0) {
                return { ...remoteSt, entries: localSt.entries };
              }
              return remoteSt;
            });
            return {
              families: remoteData.families,
              students: mergedStudents,
            };
          });
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

  // Read URL query parameter for family (?fam=<familyId>) or student (?student=<id> / ?st=<id>)
  const [activeFamilyId, setActiveFamilyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student') || params.get('st');
    if (studentParam) {
      const famWithStudent = data.families.find((f) => f.studentIds.includes(studentParam));
      if (famWithStudent) {
        return famWithStudent.id;
      }
    }
    const famParam = params.get('fam');
    if (famParam && data.families.some((f) => f.id === famParam)) {
      return famParam;
    }
    return data.families[0]?.id || 'family-1';
  });

  // View state: 'portal' (Master 3-families landing portal) vs 'family' (individual family page)
  const [currentView, setCurrentView] = useState<'portal' | 'family'>(() => {
    const params = new URLSearchParams(window.location.search);
    const hasStudentOrFam = params.get('fam') || params.get('student') || params.get('st');
    return hasStudentOrFam ? 'family' : 'portal';
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
  const [settingsStudentId, setSettingsStudentId] = useState<string | null>(null);

  const settingsStudent = useMemo(() => {
    return settingsStudentId ? data.students.find((s) => s.id === settingsStudentId) || null : null;
  }, [data.students, settingsStudentId]);

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

  // Student Memorization Focus & Recitation Notes Modal State
  const [isFocusNotesModalOpen, setIsFocusNotesModalOpen] = useState<boolean>(false);

  // Smart Voice Dictation Modal State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

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
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student') || params.get('st');
    if (studentParam && data.students.some((s) => s.id === studentParam)) {
      return studentParam;
    }
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

  // Selected entry from the MonthNavigator timeline
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const currentActiveEntryId = useMemo(() => {
    if (selectedEntryId && monthEntries.some((e) => e.id === selectedEntryId)) {
      return selectedEntryId;
    }
    return singleMostRecentInViewId;
  }, [selectedEntryId, monthEntries, singleMostRecentInViewId]);

  const handleSelectEntryFromNav = (entryId: string) => {
    setSelectedEntryId(entryId);
    const el = document.getElementById(`entry-row-${entryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Ref to target the latest homework entry in view
  const latestHomeworkRef = useRef<HTMLDivElement | null>(null);

  // Whenever the active student changes (or their entries update from Supabase), automatically set the selected month to the month of the student's latest homework
  useEffect(() => {
    if (activeStudent?.entries && activeStudent.entries.length > 0) {
      const sorted = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      if (latest) {
        const [y, m] = latest.date.split('-').map(Number);
        if (y && m) {
          setSelectedYearMonth((prev) => {
            if (prev.year !== y || prev.month !== m) {
              return { year: y, month: m };
            }
            return prev;
          });
        }
      }
    }
  }, [activeStudentId, activeStudent?.entries?.length]);

  // Reset scroll to top whenever the student or month changes (normal natural scroll behavior)
  useEffect(() => {
    if (currentView !== 'family') return;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeStudentId, selectedYearMonth.year, selectedYearMonth.month, currentView]);

  // Handler to smoothly scroll directly to today's / latest homework entry
  const handleScrollToTodayHomework = () => {
    // If latest entry is in a different month, switch to it first
    if (activeStudent?.entries && activeStudent.entries.length > 0) {
      const sorted = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      if (latest) {
        const [y, m] = latest.date.split('-').map(Number);
        if (y && m && (selectedYearMonth.year !== y || selectedYearMonth.month !== m)) {
          setSelectedYearMonth({ year: y, month: m });
        }
      }
    }

    setTimeout(() => {
      if (latestHomeworkRef.current) {
        latestHomeworkRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);
  };

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

  // Student Profile Photo & Framing Position Handler
  const handleUpdateStudentPhoto = (
    studentId: string,
    photoUrl: string,
    photoPosition: string = '50% 20%',
    photoZoom: number = 1.0
  ) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId
          ? {
              ...st,
              photoUrl: photoUrl.trim() || undefined,
              photoPosition,
              photoZoom,
            }
          : st
      ),
    }));

    if (isSupabaseConfigured()) {
      updateStudentPhotoInSupabase(studentId, photoUrl, photoPosition, photoZoom).catch((err) =>
        console.warn('Supabase photo update error:', err)
      );
    }
  };

  // Student Memorization Focus Notes & Recitation Bookmark Handler
  const handleSaveFocusNotes = (
    studentId: string,
    memorizationFocus: string,
    tilawaSurah: number,
    tilawaAyah: number,
    motivationalMessage?: string
  ) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId
          ? {
              ...st,
              memorizationFocus: memorizationFocus.trim() || undefined,
              tilawaSurah,
              tilawaAyah,
              motivationalMessage:
                motivationalMessage !== undefined
                  ? motivationalMessage.trim() || undefined
                  : st.motivationalMessage,
            }
          : st
      ),
    }));

    if (isSupabaseConfigured()) {
      updateStudentFocusInSupabase(
        studentId,
        memorizationFocus,
        tilawaSurah,
        tilawaAyah,
        motivationalMessage
      ).catch((err) => console.warn('Supabase focus update error:', err));
    }
  };

  // Smart Voice Dictation & AI Homework Handler
  const handleSaveVoiceHomework = (
    studentId: string,
    entryDate: string,
    hifz: string,
    revision: string,
    grade?: GradeValue,
    memorizationFocus?: string,
    tilawaSurah?: number,
    tilawaAyah?: number
  ) => {
    // 1. If hifz or revision is present, add new homework entry
    if (hifz || revision) {
      const newEntry: Entry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: entryDate,
        hifzText: hifz || '—',
        hifzGrade: grade ?? null,
        murajaaText: revision || '',
        murajaaGrade: null,
      };

      setData((prev) => ({
        ...prev,
        students: prev.students.map((st) =>
          st.id === studentId
            ? {
                ...st,
                entries: [newEntry, ...st.entries],
              }
            : st
        ),
      }));

      if (isSupabaseConfigured()) {
        upsertEntryInSupabase(studentId, newEntry).catch((err) =>
          console.warn('Supabase entry upsert error:', err)
        );
      }
    }

    // 2. Update focus notes and tilawa bookmark
    if (memorizationFocus !== undefined || tilawaSurah !== undefined) {
      handleSaveFocusNotes(
        studentId,
        memorizationFocus !== undefined ? memorizationFocus : (activeStudent?.memorizationFocus || ''),
        tilawaSurah !== undefined ? tilawaSurah : (activeStudent?.tilawaSurah || 18),
        tilawaAyah !== undefined ? tilawaAyah : (activeStudent?.tilawaAyah || 1)
      );
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
      <>
        <MainPortal
          families={data.families}
          students={data.students}
          onSelectFamilyAndStudent={handleSelectFamilyAndStudent}
          isTeacherAuthenticated={isTeacherAuthenticated}
          onTeacherLoginSuccess={handleTeacherLoginSuccess}
          onTeacherLogout={handleTeacherLogout}
          isTeacherMode={isTeacherMode}
          onToggleTeacherMode={handleToggleTeacherMode}
          onOpenStudentSettings={(st) => setSettingsStudentId(st.id)}
          onSyncToSupabase={() => syncAllLocalDataToSupabase(data)}
        />
        {settingsStudent && (
          <StudentSettingsModal
            isOpen={Boolean(settingsStudent)}
            onClose={() => setSettingsStudentId(null)}
            student={settingsStudent}
            familyName={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.name}
            familyId={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id}
            isTeacherMode={isTeacherMode}
            onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
            onUpdateStudentPhoto={handleUpdateStudentPhoto}
          />
        )}
      </>
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
        onOpenVoiceDictation={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Content Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="main-scroll-view"
        className="flex-1 w-full overflow-y-auto pt-16 sm:pt-18 pb-16 sm:pb-20 px-1.5 sm:px-4 md:px-6"
      >
        <div className="w-full max-w-3xl sm:max-w-4xl mx-auto flex flex-col items-stretch space-y-2.5">
          {/* Quick Jump to Today's Homework Button (Short English text with Arabic tooltip) */}
          {monthEntries.length > 0 && (
            <div className="flex justify-center w-full px-2 pt-0.5">
              <button
                id="jump-to-today-homework-btn"
                type="button"
                onClick={handleScrollToTodayHomework}
                className="group flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#0E5C56] to-[#127068] hover:from-[#0B4A45] hover:to-[#0E5C56] text-[#F5EFDD] rounded-full text-xs sm:text-sm font-bold shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer border border-[#B8860B]/30"
                title="اضغط هنا للذهاب إلى واجبك اليوم"
              >
                <span className="font-sans font-bold tracking-tight">
                  Go to Today's Homework
                </span>
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5C378] group-hover:translate-y-0.5 transition-transform stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Month Navigator Bar */}
          <MonthNavigator
            isCurrent={isCurrentMonth}
            monthLabel={selectedMonthLabel}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToCurrentMonth={handleGoToCurrentMonth}
            entries={monthEntries}
            activeEntryId={currentActiveEntryId}
            onSelectEntry={handleSelectEntryFromNav}
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
                  لا توجد واجبات مسجلة لشهر {selectedMonthLabel}
                </h3>
                {activeStudent && activeStudent.entries && activeStudent.entries.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-xs text-[#5B6478] mb-2 font-sans">
                      يوجد {activeStudent.entries.length} واجباً مسجلاً للطالب في أشهر سابقة
                    </p>
                    <button
                      type="button"
                      onClick={handleScrollToTodayHomework}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E5C56] text-[#F5EFDD] text-xs font-bold hover:bg-[#0B4A45] active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <span>الانتقال لآخر شهر به واجبات</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
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

                  // Show star band at the end of each week in the month:
                  // either when followed by subsequent week entries, OR if it is the latest entry of the current active week!
                  const isLatestEntryOverall = idx === monthEntries.length - 1;
                  const shouldShowStarBand =
                    isWeekEndingInCurrentMonth &&
                    isLastEntryOfWeekInMonth &&
                    (hasSubsequentSaturdayEntry || isLatestEntryOverall);

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
                    <div
                      key={`entry-group-${entry.id}`}
                      ref={entry.id === singleMostRecentInViewId ? latestHomeworkRef : undefined}
                      className="w-full"
                    >
                      <HomeworkRow
                        key={`month-entry-${entry.id}`}
                        entry={entry}
                        isTeacherMode={isTeacherMode}
                        isMostRecentUngraded={entry.id === mostRecentUngradedEntryId}
                        isSingleMostRecentInView={entry.id === singleMostRecentInViewId}
                        selectedMonthPrefix={selectedMonthPrefix}
                        studentSurahRatings={activeStudent?.surahRatings}
                        showOnTime={isYusuf}
                        onOpenStudentNotes={() => setIsFocusNotesModalOpen(true)}
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
                          title="This week so far"
                          subtitle={activeStudent.motivationalMessage}
                          isTeacherMode={isTeacherMode}
                          onUpdateMotivationalMessage={(newMsg) => {
                            handleSaveFocusNotes(
                              activeStudent.id,
                              activeStudent.memorizationFocus || '',
                              activeStudent.tilawaSurah || 18,
                              activeStudent.tilawaAyah || 1,
                              newMsg
                            );
                          }}
                        />
                      )}
                    </div>
                  );
                });
              })()
            )}

            {/* Teacher Mode: Single "Repeat +" Button & Voice AI Button */}
            {isTeacherMode && (
              <AddHomeworkRow
                lastEntry={mostRecentStudentEntry}
                onRepeatLastEntry={handleRepeatLastHomework}
                onOpenVoiceDictation={() => setIsVoiceModalOpen(true)}
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
        onOpenFocusNotes={() => {
          setIsSidebarOpen(false);
          setIsFocusNotesModalOpen(true);
        }}
        onOpenStudentSettings={(st) => {
          setIsSidebarOpen(false);
          setSettingsStudentId(st.id);
        }}
      />

      {/* Smart Voice Dictation & AI Homework Modal */}
      {activeStudent && (
        <VoiceHomeworkModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          student={activeStudent}
          onSaveNewHomework={handleSaveVoiceHomework}
        />
      )}

      {/* Student Focus Areas & Recitation Bookmark Modal */}
      {activeStudent && (
        <StudentFocusNotesModal
          isOpen={isFocusNotesModalOpen}
          onClose={() => setIsFocusNotesModalOpen(false)}
          student={activeStudent}
          isTeacherMode={isTeacherMode}
          onSaveFocusNotes={handleSaveFocusNotes}
        />
      )}

      {/* Dedicated Separate Page / Modal for Student Settings (Attendance Days & Direct Share Link) */}
      {settingsStudent && (
        <StudentSettingsModal
          isOpen={Boolean(settingsStudent)}
          onClose={() => setSettingsStudentId(null)}
          student={settingsStudent}
          familyName={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.name || activeFamily?.name}
          familyId={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id || activeFamily?.id}
          isTeacherMode={isTeacherMode}
          onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
          onUpdateStudentPhoto={handleUpdateStudentPhoto}
        />
      )}

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
          student={data.students.find((s) => s.id === selectedSurahStudent.id) || selectedSurahStudent}
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
