import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  X,
  BookOpen,
  Target,
  Award,
  RefreshCw,
  Calendar,
  Volume2,
  FileText,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Student, GradeValue } from '../types';
import { QURAN_SURAHS } from '../data/quranSurahs';
import { parseDictatedHomework, checkGeminiStatus, ParsedHomeworkResult } from '../utils/aiDictationParser';
import { formatLocalDate } from '../utils/dateUtils';

interface VoiceHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSaveNewHomework: (
    studentId: string,
    entryDate: string,
    hifz: string,
    revision: string,
    grade?: GradeValue,
    memorizationFocus?: string,
    tilawaSurah?: number,
    tilawaAyah?: number
  ) => void;
}

function parseGradeToValue(gradeStr?: string | number): GradeValue | undefined {
  if (!gradeStr) return undefined;
  if (typeof gradeStr === 'number') {
    if ([100, 80, 60, 40, 20].includes(gradeStr)) return gradeStr as GradeValue;
  }
  const s = String(gradeStr).toUpperCase().trim();
  if (s === '100' || s === 'E' || s === 'EXCELLENT' || s === 'ممتاز') return 100;
  if (s === '80' || s === 'VG' || s === 'VERY GOOD' || s === 'جيد جدا' || s === 'جيد جداً') return 80;
  if (s === '60' || s === 'G' || s === 'GOOD' || s === 'جيد') return 60;
  if (s === '40' || s === 'P' || s === 'PASS' || s === 'PASSED' || s === 'مقبول') return 40;
  if (s === '20' || s === 'F' || s === 'WEAK' || s === 'FAIL' || s === 'ضعيف' || s === 'R' || s === 'إعادة') return 20;
  return undefined;
}

const SAMPLE_VOICE_PROMPTS = [
  'الكهف من ١ الي ٥ والمراجعه سوره البقره من ٤ الي ٧',
  'واجب الحفظ سورة الكهف من 1 إلى 20، والمراجعة سورة مريم كاملة، التقييم ممتاز، وركز على أحكام المدود ومخارج الحروف، وسورة التلاوة الكهف آية 15',
  'سليمان، حفظ سورة النبأ من 1 لـ 15 ومراجعة سورة الملك، التقييم جيد جدا، وركز على المتشابهات، والتلاوة سورة يس آية 22',
];

export const VoiceHomeworkModal: React.FC<VoiceHomeworkModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveNewHomework,
}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [entryDate, setEntryDate] = useState(() => formatLocalDate(new Date()));
  const [geminiConnected, setGeminiConnected] = useState<boolean | null>(null);

  // Parsed structured state
  const [parsedData, setParsedData] = useState<ParsedHomeworkResult | null>(null);
  const [editableHifz, setEditableHifz] = useState('');
  const [editableRevision, setEditableRevision] = useState('');
  const [editableGrade, setEditableGrade] = useState<GradeValue | undefined>(undefined);
  const [editableFocus, setEditableFocus] = useState(student.memorizationFocus || '');
  const [editableTilawaSurah, setEditableTilawaSurah] = useState<number>(student.tilawaSurah || 18);
  const [editableTilawaAyah, setEditableTilawaAyah] = useState<number>(student.tilawaAyah || 1);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Sync initial student state
  useEffect(() => {
    if (isOpen) {
      setEditableFocus(student.memorizationFocus || '');
      setEditableTilawaSurah(student.tilawaSurah || 18);
      setEditableTilawaAyah(student.tilawaAyah || 1);
      setEntryDate(formatLocalDate(new Date()));
      setMicErrorMessage(null);

      // Check Gemini connection status
      checkGeminiStatus().then((isConnected) => {
        setGeminiConnected(isConnected);
      });
    }
  }, [isOpen, student]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllRecording();
    };
  }, []);

  const stopAllRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  const toggleListening = async () => {
    if (isListening) {
      stopAllRecording();
      // Auto analyze if we have transcript
      if (transcript.trim()) {
        handleAnalyzeText(transcript);
      }
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    setMicErrorMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    // First request microphone permission explicitly so browser won't silently fail
    let userStream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicErrorMessage('يرجى السماح بصلاحية الميكروفون في المتصفح لاستخدام التسجيل الصوتي.');
      } else {
        setMicErrorMessage('تعذر الوصول إلى الميكروفون. يمكنك كتابة أو لصق النص في المربع أدناه.');
      }
      setIsListening(false);
      return;
    }

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setMicErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + ' ';
          }
          const cleanText = currentText.trim();
          if (cleanText) {
            setTranscript(cleanText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event);
          if (event.error === 'not-allowed') {
            setMicErrorMessage('تم رفض إذن الميكروفون من المتصفح.');
          } else if (event.error === 'network') {
            setMicErrorMessage('خدمة التعرف الصوتي تحتاج لاتصال إنترنت نشط بالمتصفح.');
          } else if (event.error === 'no-speech') {
            // normal if user was silent for a bit
          } else {
            setMicErrorMessage(`تنبيه من المتصفح: ${event.error || 'خطأ في الصوت'}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // Release userStream tracks
          if (userStream) {
            userStream.getTracks().forEach((track) => track.stop());
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err: any) {
        console.warn('Failed to start SpeechRecognition directly:', err);
      }
    }

    // Fallback: If SpeechRecognition is blocked or not available in this browser/frame
    setSpeechSupported(false);
    setMicErrorMessage(
      'المتصفح أو الإطار الحالي يقيّد التعرف الصوتي المباشر. يمكنك استخدام النماذج السريعة بالأسفل أو لصق نص الواجب.'
    );
    if (userStream) {
      userStream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleAnalyzeText = async (textToAnalyze?: string) => {
    const text = textToAnalyze || transcript;
    if (!text.trim()) return;

    if (isListening) {
      stopAllRecording();
    }

    setIsAnalyzing(true);
    try {
      const result = await parseDictatedHomework(text, student.name);
      setParsedData(result);

      if (result.hifz) setEditableHifz(result.hifz);
      if (result.revision) setEditableRevision(result.revision);
      if (result.grade) setEditableGrade(parseGradeToValue(result.grade));
      if (result.memorizationFocus) setEditableFocus(result.memorizationFocus);
      if (result.tilawaSurah) setEditableTilawaSurah(result.tilawaSurah);
      if (result.tilawaAyah) setEditableTilawaAyah(result.tilawaAyah);
    } catch (err) {
      console.error('Error analyzing homework:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySample = (sample: string) => {
    setTranscript(sample);
    handleAnalyzeText(sample);
  };

  const handleSaveAndApply = () => {
    onSaveNewHomework(
      student.id,
      entryDate,
      editableHifz.trim(),
      editableRevision.trim(),
      editableGrade,
      editableFocus.trim(),
      editableTilawaSurah,
      editableTilawaAyah
    );
    onClose();
  };

  const currentTilawaSurah =
    QURAN_SURAHS.find((s) => s.number === editableTilawaSurah) || QURAN_SURAHS[0];

  return (
    <AnimatePresence>
      <div
        id="voice-homework-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        dir="rtl"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          id="voice-homework-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#FAF6EE] text-[#1F2A3D] rounded-3xl shadow-2xl border border-[#B8860B]/40 overflow-hidden flex flex-col my-auto z-10 max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0E5C56] via-[#0D534E] to-[#0A423E] text-[#F1E7CE] px-5 py-3.5 flex items-center justify-between border-b border-[#B8860B]/40 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B8860B]/25 border border-[#B8860B]/60 flex items-center justify-center text-[#F1E7CE] shadow-xs">
                <Mic className="w-5 h-5 text-[#E6C673]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-[#F1E7CE]">
                    الإملاء الصوتي الذكي للواجب (AI)
                  </h2>
                  <span className="text-[10px] bg-[#B8860B] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Gemini AI</span>
                  </span>
                  {geminiConnected !== null && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        geminiConnected
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                          : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                      }`}
                    >
                      {geminiConnected ? '● متصل بـ Gemini' : '● المحلل الفوري النشط'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#E6C673] font-medium mt-0.5">
                  تحدث بالواجب أو الصق نص المكالمة وسيقوم الذكاء الاصطناعي بتصنيفه تلقائياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#F1E7CE] hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-right">
            {/* Student info banner */}
            <div className="bg-white rounded-2xl p-3 border border-[#B8860B]/25 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {student.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-[#5B6478] block">الطالب المستهدف:</span>
                  <span className="text-sm font-bold text-[#0E5C56]">
                    {student.name} {student.arabicName ? `(${student.arabicName})` : ''}
                  </span>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-1.5 text-xs text-[#5B6478]">
                <Calendar className="w-3.5 h-3.5 text-[#B8860B]" />
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-[#FAF6EE] border border-[#B8860B]/30 rounded-lg px-2 py-1 text-xs font-bold text-[#0E5C56] cursor-pointer"
                />
              </div>
            </div>

            {/* Mic Dictation Section */}
            <div className="bg-white rounded-2xl p-4 border border-[#B8860B]/25 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E5C56] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#B8860B]" />
                  <span>تحدث بصوتك أو اكتب نص الواجب:</span>
                </span>

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-[#FAF6EE] p-0.5 rounded-lg border border-[#B8860B]/20 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setLanguage('ar-SA')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      language === 'ar-SA' ? 'bg-[#0E5C56] text-white shadow-2xs' : 'text-[#5B6478]'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en-US')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      language === 'en-US' ? 'bg-[#0E5C56] text-white shadow-2xs' : 'text-[#5B6478]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Main Microphone Button & Visualizer */}
              <div className="flex flex-col items-center justify-center py-2 space-y-2.5">
                <button
                  id="start-voice-mic-btn"
                  type="button"
                  onClick={toggleListening}
                  className={`w-18 h-18 rounded-full flex items-center justify-center text-white shadow-lg transition-all cursor-pointer relative active:scale-95 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-300 animate-pulse'
                      : 'bg-[#0E5C56] hover:bg-[#0A423E] hover:shadow-xl'
                  }`}
                  title={isListening ? 'اضغط لإيقاف التسجيل' : 'اضغط للبدء بالتحدث'}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-[#F1E7CE]" />
                  )}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                    </span>
                  )}
                </button>

                <p className="text-xs font-bold text-[#0E5C56]">
                  {isListening ? '🔴 جاري الاستماع... تحدث الآن بالواجب' : 'اضغط على الميكروفون للتحدث'}
                </p>

                {/* Error or Browser Warning Banner */}
                {micErrorMessage && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 w-full">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{micErrorMessage}</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        يمكنك كتابة الواجب أو النقر على أحد الأمثلة الجاهزة بالأسفل للاختبار الفوري.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript Textarea */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="مثال: واجب الحفظ سورة الكهف من 1 إلى 20، والمراجعة سورة مريم، والتقييم ممتاز، وركز على أحكام المدود، وسورة التلاوة الكهف آية 15..."
                  className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl p-3 text-xs sm:text-sm text-[#1F2A3D] placeholder-[#8A94A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56] transition-all resize-y leading-relaxed font-sans"
                />

                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setParsedData(null);
                    }}
                    className="absolute top-2 left-2 text-[10px] text-[#5B6478] hover:text-red-600 bg-white/80 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Action: Analyze with AI */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    id="analyze-voice-homework-btn"
                    type="button"
                    disabled={isAnalyzing || !transcript.trim()}
                    onClick={() => handleAnalyzeText()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                      transcript.trim() && !isAnalyzing
                        ? 'bg-[#B8860B] hover:bg-[#976D07] text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التحليل بالذكاء الاصطناعي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>تحليل الواجب واستخراج البيانات ✨</span>
                      </>
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-[#5B6478]">
                  أو جرّب أحد النماذج الجاهزة أدناه ↓
                </span>
              </div>

              {/* Quick Sample Prompts */}
              <div className="pt-2 border-t border-[#B8860B]/15">
                <span className="text-[10px] font-bold text-[#5B6478] block mb-1">
                  أمثلة جاهزة للتجربة الفورية بنقرة واحدة:
                </span>
                <div className="flex flex-col gap-1">
                  {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                    <button
                      key={`sample-${idx}`}
                      type="button"
                      onClick={() => handleApplySample(sample)}
                      className="text-right text-[11px] text-[#0E5C56] hover:bg-[#FAF6EE] p-1.5 rounded-lg border border-[#B8860B]/20 transition-colors cursor-pointer truncate flex items-center justify-between group"
                    >
                      <span className="truncate">🗣️ "{sample}"</span>
                      <span className="text-[10px] text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-2">
                        تجربة ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* =========================================================================
                Parsed Results & Quick Adjustment Form
               ========================================================================= */}
            <div className="bg-white rounded-2xl p-4 border border-[#B8860B]/35 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#B8860B]/20 pb-2">
                <span className="text-xs font-bold text-[#0E5C56] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#B8860B]" />
                  <span>البيانات المستخرجة (يمكنك تعديل أي خانة قبل الحفظ):</span>
                </span>
                {parsedData?.source && (
                  <span className="text-[10px] bg-[#0E5C56]/10 text-[#0E5C56] px-2 py-0.5 rounded-full font-bold">
                    {parsedData.source === 'gemini' ? 'تحليل Gemini الذكي ✓' : 'المحلل الفوري ✓'}
                  </span>
                )}
              </div>

              {/* Hifz & Revision Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hifz */}
                <div>
                  <label className="block text-[11px] font-bold text-[#0E5C56] mb-1">
                    واجب الحفظ الجديد:
                  </label>
                  <input
                    type="text"
                    value={editableHifz}
                    onChange={(e) => setEditableHifz(e.target.value)}
                    placeholder="مثال: الكهف 1 - 20"
                    className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]"
                  />
                </div>

                {/* Revision */}
                <div>
                  <label className="block text-[11px] font-bold text-[#0E5C56] mb-1">
                    واجب المراجعة والتثبيت:
                  </label>
                  <input
                    type="text"
                    value={editableRevision}
                    onChange={(e) => setEditableRevision(e.target.value)}
                    placeholder="مثال: مريم كاملة"
                    className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0E5C56] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]"
                  />
                </div>
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#0E5C56] mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>التقييم المستخرج:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { val: 100, label: 'ممتاز (100)', color: 'bg-emerald-600 text-white' },
                      { val: 80, label: 'جيد جداً (80)', color: 'bg-blue-600 text-white' },
                      { val: 60, label: 'جيد (60)', color: 'bg-amber-600 text-white' },
                      { val: 40, label: 'مقبول (40)', color: 'bg-orange-500 text-white' },
                      { val: 20, label: 'ضعيف (20)', color: 'bg-rose-600 text-white' },
                    ] as const
                  ).map((gr) => (
                    <button
                      key={gr.val}
                      type="button"
                      onClick={() =>
                        setEditableGrade(editableGrade === gr.val ? undefined : (gr.val as GradeValue))
                      }
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        editableGrade === gr.val
                          ? `${gr.color} shadow-xs ring-2 ring-[#B8860B]`
                          : 'bg-[#FAF6EE] text-[#5B6478] hover:bg-[#F3EAD3] border border-[#B8860B]/25'
                      }`}
                    >
                      {gr.label}
                    </button>
                  ))}
                  {editableGrade !== undefined && (
                    <button
                      type="button"
                      onClick={() => setEditableGrade(undefined)}
                      className="text-[10px] text-gray-500 underline px-1 cursor-pointer"
                    >
                      بدون تقييم
                    </button>
                  )}
                </div>
              </div>

              {/* Focus Points & Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#0E5C56] mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>نقاط تركيز الطالب وتوجيهات الحفظ:</span>
                </label>
                <input
                  type="text"
                  value={editableFocus}
                  onChange={(e) => setEditableFocus(e.target.value)}
                  placeholder="مثال: ضبط المتشابهات وأحكام المدود ومخارج الحروف"
                  className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl px-3 py-1.5 text-xs text-[#1F2A3D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E5C56]"
                />
              </div>

              {/* Tilawa Bookmark */}
              <div>
                <label className="block text-[11px] font-bold text-[#0E5C56] mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>سورة التلاوة الحالية (الورد القرآني):</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={editableTilawaSurah}
                    onChange={(e) => setEditableTilawaSurah(Number(e.target.value))}
                    className="flex-1 bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl py-1.5 px-2 text-xs font-bold text-[#0E5C56] cursor-pointer"
                  >
                    {QURAN_SURAHS.map((s) => (
                      <option key={`tilawa-opt-${s.number}`} value={s.number}>
                        {s.number}. {s.arabicName} ({s.name})
                      </option>
                    ))}
                  </select>

                  <div className="w-24 shrink-0 flex items-center gap-1">
                    <span className="text-[10px] text-[#5B6478] font-bold">آية:</span>
                    <input
                      type="number"
                      min={1}
                      max={currentTilawaSurah.ayahCount}
                      value={editableTilawaAyah}
                      onChange={(e) => setEditableTilawaAyah(Number(e.target.value))}
                      className="w-full bg-[#FAF6EE] border border-[#B8860B]/30 rounded-xl py-1.5 px-1.5 text-center text-xs font-bold text-[#0E5C56]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-[#F5EFDD] border-t border-[#B8860B]/20 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6478] hover:bg-black/5 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-6 py-2.5 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4 text-[#86EFAC]" />
              <span>تطبيق وحفظ في شريحة الطالب مباشرة</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
