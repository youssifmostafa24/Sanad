import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Family, Student, Entry, SurahMemorizationStatus, GradeValue, ManualWeeklyStars, AuthState } from './types';
import { getInitialData } from './data/seedData';
import {
  formatLocalDate,
  parseLocalDate,
  getWeekBounds,
  addDays,
  getNextAttendanceDate,
  generateHomeworkEntryId,
  getWeeklyStarRating,
  isCurrentStudyWeek,
  getWeeklyStarCardTitle,
} from './utils/dateUtils';
import { Header } from './components/Header';
import { HomeworkRow } from './components/HomeworkRow';
import { AddHomeworkRow } from './components/AddHomeworkRow';
import { WeeklyStarBand } from './components/WeeklyStarBand';
import { StudentSwitcher } from './components/StudentSwitcher';
import { StudentSidebarDrawer } from './components/StudentSidebarDrawer';
import { StudentTopNavPills, StudentReadingCard, StudentTopNavTab } from './components/StudentTopSection';
import { StudentMemorizationSummaryView } from './components/StudentMemorizationSummaryView';
import { StudentFocusNotesView } from './components/StudentFocusNotesView';
import { MonthPickerBottomSheet } from './components/MonthPickerBottomSheet';
import { MainPortal } from './components/MainPortal';
import { StudentAttendanceModal } from './components/StudentAttendanceModal';
import { SurahProgressModal } from './components/SurahProgressModal';
import { StudentSettingsModal } from './components/StudentSettingsModal';
import { VoiceHomeworkModal } from './components/VoiceHomeworkModal';
import { getStoredAuthState, setStoredAuthState } from './utils/authUtils';
import { canEdit } from './utils/permissions';
import { normalizeQuranHomeworkText } from './data/quranSurahs';
import { getDefaultMotivationalTitle } from './data/starBandPresets';
import { BookOpen, ArrowDown, ChevronRight, Lock } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchAllDataFromSupabase,
  upsertEntryInSupabase,
  deleteEntryInSupabase,
  updateStudentSurahRatingsInSupabase,
  updateStudentTilawaInSupabase,
  updateStudentAttendanceInSupabase,
  updateFamilyAttendanceInSupabase,
  updateFamilyParentPasswordInSupabase,
  updateStudentPhotoInSupabase,
  updateStudentFocusInSupabase,
  saveWeeklyStarSettingsInSupabase,
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
          // When Supabase connects, Supabase is the Single Source of Truth!
          // We cleanly replace local state with remote data.
          // Only if remoteData has 0 entries for a student who has entries locally, we retain them.
          setData((prev) => {
            const mergedStudents = remoteData.students.map((remoteSt) => {
              if (remoteSt.entries && remoteSt.entries.length > 0) {
                // Deduplicate strictly by date: exactly 1 entry per date!
                const dateMap = new Map<string, Entry>();
                remoteSt.entries.forEach((e) => {
                  if (!dateMap.has(e.date)) {
                    dateMap.set(e.date, e);
                  }
                });
                return {
                  ...remoteSt,
                  entries: Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
                };
              }
              return { ...remoteSt, entries: [] };
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
              if (remoteSt.entries && remoteSt.entries.length > 0) {
                const dateMap = new Map<string, Entry>();
                remoteSt.entries.forEach((e) => {
                  if (!dateMap.has(e.date)) {
                    dateMap.set(e.date, e);
                  }
                });
                return {
                  ...remoteSt,
                  entries: Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
                };
              }
              return { ...remoteSt, entries: [] };
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

  // Helper to match student param flexibly (e.g. 'musab' <-> 'student-musab', 'مصعب')
  const findMatchingStudentId = (paramVal: string, studentList: Student[]): string | null => {
    if (!paramVal) return null;
    const cleanParam = paramVal.trim().toLowerCase();
    const shortParam = cleanParam.replace(/^student-/, '');

    const found = studentList.find((s) => {
      const sId = s.id.toLowerCase();
      const sShortId = sId.replace(/^student-/, '');
      const sName = (s.name || '').toLowerCase().trim();
      const sArabic = (s.arabicName || '').trim();
      return (
        sId === cleanParam ||
        sShortId === shortParam ||
        sName === shortParam ||
        sName === cleanParam ||
        (sArabic && (sArabic === paramVal.trim() || cleanParam.includes(sArabic)))
      );
    });
    return found ? found.id : null;
  };

  // Read URL query parameter for family (?fam=<familyId>) or student (?student=<id> / ?st=<id>)
  // Priority: URL query parameters ALWAYS have higher priority than localStorage!
  const [activeFamilyId, setActiveFamilyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student') || params.get('st');
    if (studentParam) {
      const matchedStudentId = findMatchingStudentId(studentParam, data.students);
      if (matchedStudentId) {
        const famWithStudent = data.families.find((f) => f.studentIds.includes(matchedStudentId));
        if (famWithStudent) {
          return famWithStudent.id;
        }
      }
    }
    const famParam = params.get('fam');
    if (famParam) {
      const matchedFam = data.families.find(
        (f) => f.id === famParam || f.id === `family-${famParam}` || f.id.endsWith(famParam)
      );
      if (matchedFam) {
        return matchedFam.id;
      }
    }
    // Check localStorage for returning student/family only if no URL params
    const initialAuth = getStoredAuthState();
    if (initialAuth.role === 'parent' && initialAuth.scopedFamilyId) {
      return initialAuth.scopedFamilyId;
    }
    try {
      const savedFam = localStorage.getItem('sanad_last_family_id');
      if (savedFam && data.families.some((f) => f.id === savedFam)) {
        return savedFam;
      }
    } catch {}
    return data.families[0]?.id || 'family-1';
  });

  // View state: 'portal' vs 'family'
  // Priority 1.3: Returning students land directly on their family page, not the all-families portal.
  const [currentView, setCurrentView] = useState<'portal' | 'family'>(() => {
    const params = new URLSearchParams(window.location.search);
    const hasStudentOrFam = params.get('fam') || params.get('student') || params.get('st');
    if (hasStudentOrFam) return 'family';

    const initialAuth = getStoredAuthState();
    if (initialAuth.role === 'parent') return 'family';

    try {
      const savedStudent = localStorage.getItem('sanad_last_student_id');
      if (savedStudent && data.students.some((s) => s.id === savedStudent)) {
        return 'family';
      }
    } catch {}

    // Only teachers start in the multi-family portal by default
    return initialAuth.role === 'teacher' ? 'portal' : 'family';
  });

  // Role-based auth state: 'teacher' | 'parent' | 'student'
  const [authState, setAuthState] = useState<AuthState>(() => {
    return getStoredAuthState();
  });

  const isTeacher = authState.role === 'teacher';
  // Teacher mode active status (teachers can toggle it on/off; parents have family edit enabled)
  const [teacherModeActive, setTeacherModeActive] = useState<boolean>(true);

  // Modals state
  const [isFamilyAttendanceOpen, setIsFamilyAttendanceOpen] = useState<boolean>(false);
  const [attendanceModalStudentId, setAttendanceModalStudentId] = useState<string | null>(null);
  const [selectedSurahStudent, setSelectedSurahStudent] = useState<Student | null>(null);
  const [settingsStudentId, setSettingsStudentId] = useState<string | null>(null);

  const settingsStudent = useMemo(() => {
    return settingsStudentId ? data.students.find((s) => s.id === settingsStudentId) || null : null;
  }, [data.students, settingsStudentId]);

  const handleLoginSuccess = (newAuth: AuthState) => {
    setAuthState(newAuth);
    setStoredAuthState(newAuth);
    if (newAuth.role === 'teacher') {
      setTeacherModeActive(true);
      setCurrentView('portal');
    } else if (newAuth.role === 'parent' && newAuth.scopedFamilyId) {
      setCurrentView('family');
      const parentFam = data.families.find((f) => f.id === newAuth.scopedFamilyId);
      if (parentFam) {
        setActiveFamilyId(parentFam.id);
        if (parentFam.studentIds[0]) {
          setActiveStudentId(parentFam.studentIds[0]);
        }
      }
    }
  };

  const handleLogout = () => {
    const studentAuth: AuthState = { role: 'student' };
    setAuthState(studentAuth);
    setStoredAuthState(studentAuth);
    setTeacherModeActive(false);
  };

  const handleToggleTeacherMode = () => {
    setTeacherModeActive((prev) => !prev);
  };

  const handleUpdateFamilyParentPassword = (familyId: string, passwordHash?: string) => {
    setData((prev) => ({
      ...prev,
      families: prev.families.map((f) =>
        f.id === familyId ? { ...f, parentPasswordHash: passwordHash } : f
      ),
    }));
    updateFamilyParentPasswordInSupabase(familyId, passwordHash);
  };

  // Slide-out sidebar drawer state for student pages navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Smart Voice Dictation Modal State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Header auto-hide on scroll-down, show on scroll-up
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const lastScrollYRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeFamily = useMemo(() => {
    return data.families.find((f) => f.id === activeFamilyId) || data.families[0] || null;
  }, [data.families, activeFamilyId]);

  // Students available in current view (ordered according to family definition)
  const visibleStudents = useMemo(() => {
    if (!activeFamily) return data.students;
    const famStudents = activeFamily.studentIds
      .map((id) => data.students.find((s) => s.id === id))
      .filter((s): s is Student => Boolean(s));
    return famStudents.length > 0 ? famStudents : data.students;
  }, [data.students, activeFamily]);

  // Active student state - URL parameters ALWAYS take priority over localStorage!
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student') || params.get('st');
    if (studentParam) {
      const matched = findMatchingStudentId(studentParam, data.students);
      if (matched) return matched;
    }
    try {
      const savedStudent = localStorage.getItem('sanad_last_student_id');
      if (savedStudent && data.students.some((s) => s.id === savedStudent)) {
        return savedStudent;
      }
    } catch {}
    return visibleStudents[0]?.id || data.students[0]?.id || '';
  });

  // Re-synchronize URL params with activeFamily and activeStudent whenever data loads from Supabase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student') || params.get('st');
    const famParam = params.get('fam');

    if (studentParam) {
      const matched = findMatchingStudentId(studentParam, data.students);
      if (matched && matched !== activeStudentId) {
        setActiveStudentId(matched);
      }
      if (matched) {
        const famWithStudent = data.families.find((f) => f.studentIds.includes(matched));
        if (famWithStudent && famWithStudent.id !== activeFamilyId) {
          setActiveFamilyId(famWithStudent.id);
        }
      }
    } else if (famParam) {
      const matchedFam = data.families.find(
        (f) => f.id === famParam || f.id === `family-${famParam}` || f.id.endsWith(famParam)
      );
      if (matchedFam && matchedFam.id !== activeFamilyId) {
        setActiveFamilyId(matchedFam.id);
      }
    }
  }, [data.students.length, data.families.length]);

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

  // Navigation from Portal to specific family & student with localStorage persistence
  const handleSelectFamilyAndStudent = (familyId: string, studentId?: string) => {
    setActiveFamilyId(familyId);
    let chosenStudentId = studentId;
    if (!chosenStudentId) {
      const targetFam = data.families.find((f) => f.id === familyId);
      if (targetFam && targetFam.studentIds.length > 0) {
        chosenStudentId = targetFam.studentIds[0];
      }
    }
    if (chosenStudentId) {
      setActiveStudentId(chosenStudentId);
      try {
        localStorage.setItem('sanad_last_student_id', chosenStudentId);
      } catch {}
    }
    try {
      localStorage.setItem('sanad_last_family_id', familyId);
    } catch {}

    setCurrentView('family');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('fam', familyId);
      if (chosenStudentId) url.searchParams.set('student', chosenStudentId);
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Return to Main Portal (gated for teachers only)
  const handleOpenPortal = () => {
    if (authState.role !== 'teacher') {
      // Non-teacher / parent: return to their active student page or stay
      return;
    }
    setCurrentView('portal');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('fam');
      url.searchParams.delete('student');
      url.searchParams.delete('st');
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Priority 2.1: Reorder or toggle families from teacher mode
  const handleUpdateFamilyOrder = (updatedFamilies: Family[]) => {
    setData((prev) => ({
      ...prev,
      families: updatedFamilies,
    }));
  };

  // Priority 2.2: Update student share security token
  const handleSaveStudentShareToken = (studentId: string, newToken: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, shareToken: newToken } : st
      ),
    }));
  };

  // Month Navigation State: Automatically defaults to current month only
  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const now = new Date();
  const [visibleYearMonth, setVisibleYearMonth] = useState<{ year: number; month: number }>(() => ({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }));

  const visibleMonthLabel = useMemo(() => {
    const mName = MONTH_NAMES[visibleYearMonth.month - 1] || 'October';
    return `${mName} ${visibleYearMonth.year}`;
  }, [visibleYearMonth]);

  const visibleMonthPrefix = useMemo(() => {
    return `${visibleYearMonth.year}-${String(visibleYearMonth.month).padStart(2, '0')}`;
  }, [visibleYearMonth]);

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudentTopNavTab>('homework');
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Displays a continuous list across months, deduplicated and sorted chronologically
  const displayedEntries = useMemo(() => {
    if (!activeStudent?.entries || activeStudent.entries.length === 0) return [];

    // Deduplicate strictly by date: Ensure only ONE entry ever appears for the same calendar date
    const uniqueEntriesByDate = new Map<string, Entry>();
    activeStudent.entries.forEach((e) => {
      if (!uniqueEntriesByDate.has(e.date)) {
        uniqueEntriesByDate.set(e.date, e);
      } else {
        const existing = uniqueEntriesByDate.get(e.date)!;
        const isCurrentBetter =
          (e.hifzGrade !== null && existing.hifzGrade === null) ||
          (e.murajaaGrade !== null && existing.murajaaGrade === null) ||
          (e.id.startsWith('entry-') && !existing.id.startsWith('entry-'));
        if (isCurrentBetter) {
          uniqueEntriesByDate.set(e.date, e);
        }
      }
    });

    return Array.from(uniqueEntriesByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [activeStudent?.entries]);

  // Today entry and tracking if today's card is currently visible in viewport
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const todayEntry = useMemo(() => {
    if (!activeStudent?.entries) return null;
    return activeStudent.entries.find((e) => e.date === todayStr) || null;
  }, [activeStudent?.entries, todayStr]);

  const [isTodayVisible, setIsTodayVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!todayEntry) {
      setIsTodayVisible(false);
      return;
    }
    const el = document.getElementById(`entry-row-${todayEntry.id}`);
    if (!el || !scrollContainerRef.current) {
      setIsTodayVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsTodayVisible(Boolean(entry && entry.isIntersecting));
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [todayEntry?.id, displayedEntries.length]);

  // Find the single most recent entry that still has ANY ungraded portion
  const mostRecentUngradedEntryId = useMemo(() => {
    if (!activeStudent?.entries) return null;
    const sortedAllDesc = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
    const found = sortedAllDesc.find((e) => e.hifzGrade === null || e.murajaaGrade === null);
    return found ? found.id : null;
  }, [activeStudent?.entries]);

  // Single most-recent entry currently in this month's view
  const singleMostRecentInViewId = useMemo(() => {
    if (displayedEntries.length > 0) {
      return displayedEntries[displayedEntries.length - 1].id;
    }
    return null;
  }, [displayedEntries]);

  // Ref to target the latest homework entry in view
  const latestHomeworkRef = useRef<HTMLDivElement | null>(null);

  // Flag to skip resetting scroll to top (e.g., when repeating/adding a homework entry at the bottom)
  const skipResetScrollToTopRef = useRef<boolean>(false);
  const shouldScrollToBottomAfterAddRef = useRef<boolean>(false);
  const pendingScrollToLatestStudentIdRef = useRef<string | null>(null);

  // By default, automatically reset to the current month when switching students
  useEffect(() => {
    if (!activeStudentId) return;
    const n = new Date();
    setVisibleYearMonth({ year: n.getFullYear(), month: n.getMonth() + 1 });
  }, [activeStudentId]);

  // WhatsApp-style: Always open and scroll directly to the latest homework entry (centered in viewport)
  const scrollToLatestHomework = (smooth = false) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    if (activeStudent?.entries && activeStudent.entries.length > 0) {
      const sorted = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      if (latest) {
        const el = document.getElementById(`entry-row-${latest.id}`);
        if (el) {
          el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
          return;
        }
      }
    }
    if (latestHomeworkRef.current) {
      latestHomeworkRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // WhatsApp-style: Whenever the page opens, student changes, or entries load,
  // ensure the view immediately opens positioned at the latest homework entry (like the latest message in WhatsApp)!
  useEffect(() => {
    if (currentView !== 'family' || activeTab !== 'homework') return;
    if (!activeStudent?.entries || activeStudent.entries.length === 0) return;

    if (skipResetScrollToTopRef.current) {
      skipResetScrollToTopRef.current = false;
      return;
    }

    const snapToLatest = () => {
      if (activeStudent.entries && activeStudent.entries.length > 0) {
        const sorted = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0];
        if (latest) {
          const el = document.getElementById(`entry-row-${latest.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            return;
          }
        }
      }
      if (latestHomeworkRef.current) {
        latestHomeworkRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    snapToLatest();
    const f1 = requestAnimationFrame(snapToLatest);
    const t1 = setTimeout(snapToLatest, 30);
    const t2 = setTimeout(snapToLatest, 100);
    const t3 = setTimeout(snapToLatest, 250);

    return () => {
      cancelAnimationFrame(f1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeStudentId, activeTab, currentView, displayedEntries.length]);

  // Ensure the view stays scrolled to the true bottom when a new entry is added
  useEffect(() => {
    if (shouldScrollToBottomAfterAddRef.current) {
      shouldScrollToBottomAfterAddRef.current = false;
      const scrollDown = (smooth = true) => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
          });
        }
      };
      requestAnimationFrame(() => {
        scrollDown(true);
        setTimeout(() => scrollDown(true), 60);
        setTimeout(() => scrollDown(false), 220);
      });
    }
  }, [displayedEntries.length]);

  // Handler to smoothly scroll directly to today's / latest homework entry for any student
  const scrollToStudentLatestHomework = (targetStudent?: Student) => {
    const student = targetStudent || activeStudent;
    if (!student || !student.entries || student.entries.length === 0) return;

    const sorted = [...student.entries].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    if (latest) {
      const el = document.getElementById(`entry-row-${latest.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // View today's homework: smoothly scrolls to today's entry (or closest) and highlights it
  const handleViewTodayHomework = () => {
    if (!activeStudent || !activeStudent.entries || activeStudent.entries.length === 0) return;
    const today = new Date();
    const todayDateStr = formatLocalDate(today);

    let target = activeStudent.entries.find((e) => e.date === todayDateStr);
    if (!target) {
      const sorted = [...activeStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
      target = sorted[0];
    }

    if (target) {
      const el = document.getElementById(`entry-row-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedEntryId(target.id);
        setTimeout(() => {
          setHighlightedEntryId((prev) => (prev === target.id ? null : prev));
        }, 1800);
      }
    }
  };

  // Selecting a month in the bottom sheet scrolls the list to that month
  const handleSelectMonthFromPicker = (year: number, month: number) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    setVisibleYearMonth({ year, month });
    setIsMonthPickerOpen(false);

    setTimeout(() => {
      const headerEl = document.getElementById(`month-header-${monthKey}`);
      if (headerEl) {
        headerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const firstEntry = displayedEntries.find((e) => e.date.startsWith(monthKey));
        if (firstEntry) {
          const entryEl = document.getElementById(`entry-row-${firstEntry.id}`);
          entryEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 60);
  };

  // When a student switch is triggered by a double-tap, wait for page render then scroll to their latest homework
  useEffect(() => {
    if (
      pendingScrollToLatestStudentIdRef.current &&
      pendingScrollToLatestStudentIdRef.current === activeStudentId
    ) {
      pendingScrollToLatestStudentIdRef.current = null;
      scrollToStudentLatestHomework();
    }
  }, [activeStudentId, displayedEntries]);

  // Handler for single-tapping student tab in bottom switcher: switches student & immediately centers their latest homework
  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);

    const targetStudent = data.students.find((s) => s.id === studentId);
    const scrollAction = () => {
      if (targetStudent && targetStudent.entries && targetStudent.entries.length > 0) {
        const sorted = [...targetStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0];
        if (latest) {
          const el = document.getElementById(`entry-row-${latest.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            return;
          }
        }
      }
      if (latestHomeworkRef.current) {
        latestHomeworkRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    };

    scrollAction();
    requestAnimationFrame(scrollAction);
    setTimeout(scrollAction, 40);
    setTimeout(scrollAction, 120);
    setTimeout(scrollAction, 280);
  };

  // Handler for double-tapping any student tab in the bottom switcher
  const handleDoubleTapStudent = (studentId: string) => {
    const targetStudent = data.students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    if (studentId === activeStudentId) {
      // Already active student: scroll to their latest homework entry directly
      scrollToStudentLatestHomework(targetStudent);
    } else {
      // Inactive student: prevent resetting scroll to top, switch student, then scroll to latest
      skipResetScrollToTopRef.current = true;
      pendingScrollToLatestStudentIdRef.current = studentId;

      if (targetStudent.entries && targetStudent.entries.length > 0) {
        const sorted = [...targetStudent.entries].sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0];
        if (latest) {
          const [y, m] = latest.date.split('-').map(Number);
          if (y && m && (visibleYearMonth.year !== y || visibleYearMonth.month !== m)) {
            setVisibleYearMonth({ year: y, month: m });
          }
        }
      }

      setActiveStudentId(studentId);
    }
  };

  // Scroll listener: updates visible month label dynamically while scrolling and toggles WhatsApp-style floating date pill
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    // Trigger WhatsApp-style floating date pill while scrolling
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 850);

    const container = scrollContainerRef.current;
    const headers = container.querySelectorAll<HTMLElement>('[data-month-key]');
    let activeKey = '';
    headers.forEach((h) => {
      const rect = h.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (rect.top <= containerRect.top + 160) {
        activeKey = h.getAttribute('data-month-key') || '';
      }
    });

    if (!activeKey && headers.length > 0) {
      activeKey = headers[0].getAttribute('data-month-key') || '';
    }

    if (activeKey) {
      const [y, m] = activeKey.split('-');
      const yearNum = Number(y);
      const monthNum = Number(m);
      if (visibleYearMonth.year !== yearNum || visibleYearMonth.month !== monthNum) {
        setVisibleYearMonth({ year: yearNum, month: monthNum });
      }
    }
  };

  // Entry mutation handlers
  const handleUpdateEntry = (updated: Entry) => {
    if (!activeStudent) return;
    const standardUpdated: Entry = {
      ...updated,
      id: generateHomeworkEntryId(activeStudent.id, updated.date),
    };

    setData((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== activeStudent.id) return s;
        const exists = s.entries.some((e) => e.id === updated.id || e.date === updated.date);
        const newEntries = exists
          ? s.entries.map((e) => (e.id === updated.id || e.date === updated.date ? standardUpdated : e))
          : [...s.entries, standardUpdated];
        return {
          ...s,
          entries: newEntries,
        };
      });
      return { ...prev, students: updatedStudents };
    });

    if (isSupabaseConfigured()) {
      upsertEntryInSupabase(activeStudent.id, standardUpdated).catch((err) =>
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
      id: generateHomeworkEntryId(activeStudent.id, nextDate),
      date: nextDate,
      hifzText: entry.hifzText,
      hifzGrade: null, // Ungraded
      murajaaText: entry.murajaaText,
      murajaaGrade: null, // Ungraded
    };

    skipResetScrollToTopRef.current = true;
    shouldScrollToBottomAfterAddRef.current = true;

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
    setVisibleYearMonth({ year: y, month: m });
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
      id: generateHomeworkEntryId(activeStudent.id, targetDate),
      date: targetDate,
      hifzText: last ? last.hifzText : '',
      hifzGrade: null,
      murajaaText: last ? last.murajaaText : '',
      murajaaGrade: null,
    };

    // Flag to prevent jumping to top and ensure bottom stays in view
    skipResetScrollToTopRef.current = true;
    shouldScrollToBottomAfterAddRef.current = true;

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
    if (y && m && (visibleYearMonth.year !== y || visibleYearMonth.month !== m)) {
      setVisibleYearMonth({ year: y, month: m });
    }

    const scrollToTrueBottom = (smooth = true) => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    };

    // Keep both newly added entry and "+" button fully visible at the true bottom
    requestAnimationFrame(() => {
      scrollToTrueBottom(true);
      setTimeout(() => scrollToTrueBottom(true), 60);
      setTimeout(() => scrollToTrueBottom(false), 220);
    });
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
      updateStudentSurahRatingsInSupabase(activeStudent.id, updatedRatings, surahNumber, status).catch((err) =>
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
      updateStudentSurahRatingsInSupabase(studentId, updatedRatings, surahNumber, status).catch((err) =>
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

  // Handler for Weekly Star Settings: motivational note, title, manual star override & toggle (Req 9)
  const handleSaveWeeklyStarSettings = (
    studentId: string,
    weekEndDate: string,
    settings: {
      message: string;
      title: string;
      manualStars?: number;
      disableAuto: boolean;
    }
  ) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;

        const currentManualList = st.manualWeeklyStars || [];
        let updatedManualList: ManualWeeklyStars[];

        const existingIdx = currentManualList.findIndex(
          (m) => m.weekEndDate === weekEndDate || m.weekEndDate === addDays(weekEndDate, 1)
        );
        const existingEntry = existingIdx >= 0 ? currentManualList[existingIdx] : null;

        if (settings.disableAuto || settings.title || settings.message) {
          const newEntry: ManualWeeklyStars = {
            weekEndDate,
            stars: typeof settings.manualStars === 'number' ? settings.manualStars : (existingEntry?.stars ?? 0),
            disabledAuto: settings.disableAuto,
            title: settings.title ? settings.title.trim() : undefined,
            message: settings.message ? settings.message.trim() : undefined,
          };
          if (existingIdx >= 0) {
            updatedManualList = [...currentManualList];
            updatedManualList[existingIdx] = newEntry;
          } else {
            updatedManualList = [...currentManualList, newEntry];
          }
        } else {
          updatedManualList = currentManualList.filter(
            (m) => m.weekEndDate !== weekEndDate && m.weekEndDate !== addDays(weekEndDate, 1)
          );
        }

        return {
          ...st,
          motivationalMessage: settings.message ? settings.message.trim() : undefined,
          manualWeeklyStars: updatedManualList,
        };
      }),
    }));

    if (isSupabaseConfigured()) {
      const student = data.students.find((s) => s.id === studentId);
      if (student) {
        const studentManualList = student.manualWeeklyStars || [];
        const existingIdx = studentManualList.findIndex(
          (m) => m.weekEndDate === weekEndDate || m.weekEndDate === addDays(weekEndDate, 1)
        );
        let listToSave: ManualWeeklyStars[];
        if (settings.disableAuto || settings.title || settings.message) {
          const entry: ManualWeeklyStars = {
            weekEndDate,
            stars: typeof settings.manualStars === 'number' ? settings.manualStars : 5,
            disabledAuto: settings.disableAuto,
            title: settings.title ? settings.title.trim() : undefined,
            message: settings.message ? settings.message.trim() : undefined,
          };
          if (existingIdx >= 0) {
            listToSave = [...studentManualList];
            listToSave[existingIdx] = entry;
          } else {
            listToSave = [...studentManualList, entry];
          }
        } else {
          listToSave = studentManualList.filter(
            (m) => m.weekEndDate !== weekEndDate && m.weekEndDate !== addDays(weekEndDate, 1)
          );
        }

        saveWeeklyStarSettingsInSupabase(studentId, weekEndDate, settings, listToSave)
          .catch((err) => console.warn('Supabase weekly stars save notice:', err));

        updateStudentFocusInSupabase(
          studentId,
          student.memorizationFocus || '',
          student.tilawaSurah,
          student.tilawaAyah,
          settings.message
        ).catch((err) => console.warn('Supabase focus update error:', err));
      }
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
        id: generateHomeworkEntryId(studentId, entryDate),
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
    const n = new Date();
    setVisibleYearMonth({ year: n.getFullYear(), month: n.getMonth() + 1 });
  };

  // If in portal view, render the Master Portal
  if (currentView === 'portal') {
    return (
      <>
        <MainPortal
          families={data.families}
          students={data.students}
          onSelectFamilyAndStudent={handleSelectFamilyAndStudent}
          authState={authState}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          isTeacherMode={isTeacher && teacherModeActive}
          onToggleTeacherMode={handleToggleTeacherMode}
          onOpenStudentSettings={(st) => setSettingsStudentId(st.id)}
          onSyncToSupabase={() => syncAllLocalDataToSupabase(data)}
          onUpdateFamilyOrder={handleUpdateFamilyOrder}
          onUpdateFamilyParentPassword={handleUpdateFamilyParentPassword}
        />
        {settingsStudent && (
          <StudentSettingsModal
            isOpen={Boolean(settingsStudent)}
            onClose={() => setSettingsStudentId(null)}
            student={settingsStudent}
            familyName={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.name}
            familyId={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id}
            isTeacherMode={canEdit(authState, data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id)}
            onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
            onUpdateStudentPhoto={handleUpdateStudentPhoto}
            onUpdateStudentShareToken={handleSaveStudentShareToken}
          />
        )}
      </>
    );
  }

  // Route / Component Guard for Parent Role: block access if attempting to view a different family
  if (
    authState.role === 'parent' &&
    authState.scopedFamilyId &&
    activeFamily &&
    activeFamily.id !== authState.scopedFamilyId
  ) {
    const myFam = data.families.find((f) => f.id === authState.scopedFamilyId);
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F5EFDD] text-[#1F2A3D]" dir="ltr">
        <div className="w-16 h-16 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2 font-sans text-red-800">
          غير مصرح بالوصول (Not Authorized)
        </h1>
        <p className="text-sm text-[#5B6478] max-w-sm mb-6 leading-relaxed font-sans">
          حساب ولي الأمر مقيد بعائلتك فقط ({myFam?.name || 'عائلتك'}). لا يمكنك عرض أو تعديل بيانات عائلة أخرى.
        </p>
        <button
          onClick={() => {
            if (myFam) {
              setActiveFamilyId(myFam.id);
              if (myFam.studentIds[0]) setActiveStudentId(myFam.studentIds[0]);
            }
          }}
          className="px-6 py-2.5 rounded-full bg-[#0E5C56] text-white font-bold text-sm shadow-md hover:bg-[#0B4D48] transition-all cursor-pointer active:scale-95"
        >
          العودة إلى عائلتي (Return to My Family)
        </button>
      </div>
    );
  }

  const canEditCurrentFamily = canEdit(authState, activeFamily?.id);

  return (
    <div
      id="sanad-app-root"
      dir="ltr"
      className="w-full h-screen flex flex-col bg-[#F5EFDD] text-[#1F2A3D] font-sans overflow-hidden selection:bg-[#B8860B]/20"
      style={{
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(184, 134, 11, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(14, 92, 86, 0.05) 0%, transparent 40%)`,
      }}
    >
      {/* Auto-hiding Header */}
      <Header
        authState={authState}
        activeFamily={activeFamily}
        families={data.families}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onResetData={handleResetData}
        visible={headerVisible}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        activeStudentName={activeStudent?.name || activeStudent?.arabicName}
        onOpenPortal={handleOpenPortal}
        onOpenVoiceDictation={() => setIsVoiceModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* 4-Pill Top Navigation Bar (Fixed directly beneath Header) */}
      <StudentTopNavPills
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSummary={() => setActiveTab('summary')}
        onOpenNotes={() => setActiveTab('focus')}
        unreadCount={
          activeStudent?.memorizationFocus
            ? activeStudent.memorizationFocus.split('\n').filter((l) => l.trim().length > 0).length
            : 0
        }
      />

      {/* WhatsApp-style floating small date pill for current scrolling month (appears while scrolling, fades out when idle) */}
      <div
        id="whatsapp-scroll-month-pill"
        aria-hidden={!isScrolling}
        className={`pointer-events-none fixed top-[96px] sm:top-[102px] left-1/2 -translate-x-1/2 z-35 transition-all duration-300 ease-out ${
          isScrolling && activeTab === 'homework'
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="px-3.5 py-1 rounded-full bg-[#0E5C56]/90 backdrop-blur-md text-[#F5EFDD] text-[11px] sm:text-xs font-sans font-bold shadow-md border border-[#B8860B]/30 flex items-center justify-center select-none tracking-wide">
          <span>{visibleMonthLabel}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="main-scroll-view"
        className="flex-1 w-full overflow-y-auto pt-1 pb-24 sm:pb-28 px-2 sm:px-4"
      >
        <div
          className={`w-full mx-auto flex flex-col items-stretch space-y-2 transition-all duration-300 ${
            activeTab === 'summary' ? 'max-w-7xl' : 'max-w-[490px] sm:w-[490px]'
          }`}
        >
          {/* If Reading Tab is selected, show the Reading Card */}
          {activeTab === 'reading' && (
            <StudentReadingCard
              student={activeStudent}
              onSelectTab={setActiveTab}
              isTeacherMode={canEditCurrentFamily}
              onUpdateStudentTilawa={handleUpdateStudentTilawa}
            />
          )}

          {/* If Memorization Summary Tab is selected, show the Full In-Page Summary View */}
          {activeTab === 'summary' && (
            <StudentMemorizationSummaryView
              student={activeStudent}
              isTeacherMode={canEditCurrentFamily}
              onUpdateSurahStatus={(surahNumber, status) => {
                if (activeStudent) {
                  handleModalUpdateSurahStatus(activeStudent.id, surahNumber, status);
                }
              }}
              onReturnToHomework={() => setActiveTab('homework')}
            />
          )}

          {/* If Focus Notes Tab is selected, show the Focus Notes View */}
          {activeTab === 'focus' && (
            <StudentFocusNotesView
              student={activeStudent}
              onSelectTab={setActiveTab}
              isTeacherMode={canEditCurrentFamily}
              onSaveFocusNotes={handleSaveFocusNotes}
            />
          )}

          {/* List of Homework Entries across months with sticky month headers (Visible when activeTab === 'homework') */}
          {activeTab === 'homework' && (
            <div id="homework-list" className="space-y-1.5 pt-0.5">
            {displayedEntries.length === 0 ? (
              <div
                id="empty-homework-state"
                className="rounded-2xl border border-dashed border-[#B8860B]/25 bg-white p-6 text-center shadow-2xs"
              >
                <BookOpen className="w-7 h-7 mx-auto text-[#B8860B]/60 mb-1.5" />
                <h3 className="font-sans font-bold text-xs sm:text-sm text-[#0E5C56]">
                  No homework entries recorded yet
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

                return displayedEntries.map((entry, idx) => {
                  const entryMonthKey = entry.date.slice(0, 7);
                  const prevEntry = displayedEntries[idx - 1];
                  const isFirstEntryOfMonth = !prevEntry || !prevEntry.date.startsWith(entryMonthKey);

                  // Calculate week bounds for this entry
                  const weekBounds = getWeekBounds(parseLocalDate(entry.date));
                  const weekEndThursday = weekBounds.endStr;
                  const nextSaturdayStr = addDays(weekEndThursday, 2);

                  const nextEntry = displayedEntries[idx + 1];
                  const isLastEntryOfWeek =
                    !nextEntry ||
                    getWeekBounds(parseLocalDate(nextEntry.date)).endStr !== weekEndThursday;

                  const hasSubsequentSaturdayEntry = Boolean(
                    activeStudent?.entries?.some((e) => e.date >= nextSaturdayStr)
                  );

                  // Show star band at the end of a week ONLY after the next week has started
                  // (i.e. only if an entry exists on Saturday or later of the following week).
                  // If no card is placed on Saturday or after, this evaluation does not appear.
                  const shouldShowStarBand = isLastEntryOfWeek && hasSubsequentSaturdayEntry;

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
                    <React.Fragment key={`entry-frag-${entry.id}`}>
                      {/* Section Month Divider in the feed between months - ALWAYS visible */}
                      {isFirstEntryOfMonth && (() => {
                        const [y, m] = entryMonthKey.split('-');
                        const d = new Date(Number(y), Number(m) - 1, 1);
                        const monthHeaderLabel = d
                          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          .toUpperCase();
                        return (
                          <div
                            id={`month-header-${entryMonthKey}`}
                            data-month-key={entryMonthKey}
                            className="w-full py-1.5 px-3 bg-[#F5EFDD]/95 border border-[#B8860B]/15 text-[#0E5C56] font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-between my-2 rounded-lg shadow-2xs select-none"
                          >
                            <span>{monthHeaderLabel}</span>
                          </div>
                        );
                      })()}

                      <div
                        key={`entry-group-${entry.id}`}
                        ref={entry.id === singleMostRecentInViewId ? latestHomeworkRef : undefined}
                        className="w-full"
                      >
                        <HomeworkRow
                          key={`entry-row-item-${entry.id}`}
                          entry={entry}
                          isTeacherMode={canEditCurrentFamily}
                          isMostRecentUngraded={entry.id === mostRecentUngradedEntryId}
                          isSingleMostRecentInView={entry.id === singleMostRecentInViewId}
                          isHighlighted={entry.id === highlightedEntryId}
                          selectedMonthPrefix={visibleMonthPrefix}
                          studentSurahRatings={activeStudent?.surahRatings}
                          showOnTime={isYusuf}
                          onUpdateEntry={handleUpdateEntry}
                          onDeleteEntry={handleDeleteEntry}
                          onDuplicateEntry={handleDuplicateEntry}
                          onUpdateSurahStatus={handleUpdateSurahStatus}
                        />

                        {/* Weekly Star Band */}
                        {shouldShowStarBand && weekRating !== null && (() => {
                          const now = new Date();
                          const isCurrent = isCurrentStudyWeek(weekEndThursday, now);

                          const manualWeekConfig = activeStudent.manualWeeklyStars?.find(
                            (m) =>
                              m.weekEndDate === weekEndThursday ||
                              m.weekEndDate === addDays(weekEndThursday, 1)
                          );

                          // Dynamically select a preset message from the matching star tier
                          const defaultDynamicTitle = getDefaultMotivationalTitle(
                            weekRating.stars,
                            `${activeStudent.id}-${weekEndThursday}`
                          );

                          // Preserves custom title if teacher edited or set one
                          const displayWeekTitle =
                            manualWeekConfig?.title && manualWeekConfig.title.trim().length > 0
                              ? manualWeekConfig.title
                              : defaultDynamicTitle;

                          const displayWeekSubtitle = manualWeekConfig?.message || activeStudent.motivationalMessage;

                          return (
                            <WeeklyStarBand
                              key={`week-stars-${weekEndThursday}`}
                              stars={weekRating.stars}
                              autoStars={weekRating.autoStars}
                              isManualOverride={weekRating.isManual}
                              idPrefix={`week-stars-${weekEndThursday}`}
                              title={displayWeekTitle}
                              subtitle={displayWeekSubtitle}
                              isTeacherMode={canEditCurrentFamily}
                              isPastWeek={!isCurrent}
                              onSaveWeeklySettings={(settings) => {
                                handleSaveWeeklyStarSettings(activeStudent.id, weekEndThursday, settings);
                              }}
                              onUpdateMotivationalMessage={(newMsg, newTitle) => {
                                handleSaveWeeklyStarSettings(activeStudent.id, weekEndThursday, {
                                  message: newMsg,
                                  title: newTitle || displayWeekTitle,
                                  manualStars: weekRating.stars,
                                  disableAuto: weekRating.isManual,
                                });
                              }}
                            />
                          );
                        })()}
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )}

            {/* Teacher / Parent Edit Mode: Single "Repeat +" Button & Voice AI Button */}
            {canEditCurrentFamily && (
              <AddHomeworkRow
                lastEntry={mostRecentStudentEntry}
                onRepeatLastEntry={handleRepeatLastHomework}
                onOpenVoiceDictation={() => setIsVoiceModalOpen(true)}
              />
            )}

            {/* Bottom Breathing Room Spacer to guarantee full centering and visibility above bottom switcher */}
            <div id="homework-list-bottom-spacer" className="h-32 sm:h-44 w-full shrink-0" aria-hidden="true" />
          </div>
          )}
        </div>
      </main>

      {/* Month Selection Bottom Sheet */}
      <MonthPickerBottomSheet
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        currentYear={visibleYearMonth.year}
        currentMonth={visibleYearMonth.month}
        entries={activeStudent?.entries || []}
        onSelectMonth={handleSelectMonthFromPicker}
      />

      {/* Fixed Compact Bottom Student Switcher */}
      <StudentSwitcher
        students={visibleStudents}
        activeStudentId={activeStudentId}
        onSelectStudent={handleSelectStudent}
        onDoubleTapStudent={handleDoubleTapStudent}
      />

      {/* Slide-out Sidebar Drawer dedicated to Current Student */}
      <StudentSidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        student={activeStudent}
        familyName={activeFamily?.name}
        familyId={activeFamily?.id}
        isTeacherMode={canEditCurrentFamily}
        onUpdateStudentTilawa={handleUpdateStudentTilawa}
        onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
        onOpenSurahProgress={(st) => setSelectedSurahStudent(st)}
        onOpenPortal={handleOpenPortal}
        onOpenFocusNotes={() => {
          setIsSidebarOpen(false);
          setActiveTab('focus');
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

      {/* Dedicated Separate Page / Modal for Student Settings (Attendance Days & Direct Share Link) */}
      {settingsStudent && (
        <StudentSettingsModal
          isOpen={Boolean(settingsStudent)}
          onClose={() => setSettingsStudentId(null)}
          student={settingsStudent}
          familyName={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.name || activeFamily?.name}
          familyId={data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id || activeFamily?.id}
          isTeacherMode={canEdit(authState, data.families.find((f) => f.studentIds.includes(settingsStudent.id))?.id || activeFamily?.id)}
          onUpdateStudentAttendanceDays={(stId, days) => handleSaveStudentAttendance(stId, days)}
          onUpdateStudentPhoto={handleUpdateStudentPhoto}
          onUpdateStudentShareToken={handleSaveStudentShareToken}
        />
      )}

      {/* Student Attendance Settings Modal (Teacher / Parent Mode) */}
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
          isTeacherMode={canEdit(
            authState,
            data.families.find((f) => f.studentIds.includes(selectedSurahStudent.id))?.id || activeFamily?.id
          )}
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
    </div>
  );
}
