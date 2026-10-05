import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Sliders,
  Move,
  ZoomIn,
  Trash2,
  Calendar,
  Check,
  Link2,
  AlertTriangle,
  RotateCw,
  Lock,
} from 'lucide-react';
import { Student } from '../types';
import { WEEK_DAYS, getAttendanceDaysSummary } from './StudentAttendanceModal';

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  familyName?: string;
  familyId?: string;
  onUpdateStudentPhoto?: (studentId: string, photoUrl: string | undefined, position?: string, zoom?: number) => void;
  onUpdateStudentAttendanceDays: (studentId: string, days: number[]) => void;
  onUpdateStudentShareToken?: (studentId: string, newToken: string) => void;
}

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  onClose,
  student,
  familyName = 'Family',
  familyId,
  onUpdateStudentPhoto,
  onUpdateStudentAttendanceDays,
  onUpdateStudentShareToken,
}) => {
  if (!student) return null;

  // Photo settings local state
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(student.photoUrl);
  const [showPhotoControls, setShowPhotoControls] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string>(student.shareToken || student.id.slice(0, 8));
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Parse position e.g. "50% 30%"
  const initialPos = student.photoPosition || 'center 20%';
  const parsePos = (posStr: string): { x: number; y: number } => {
    const parts = posStr.split(' ');
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    return {
      x: isNaN(x) ? 50 : x,
      y: isNaN(y) ? 20 : y,
    };
  };

  const { x: defaultX, y: defaultY } = parsePos(initialPos);
  const [posX, setPosX] = useState<number>(defaultX);
  const [posY, setPosY] = useState<number>(defaultY);
  const [zoom, setZoom] = useState<number>(student.photoZoom || 1);

  // Dragging gesture state for direct touch/mouse repositioning
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: 50,
    startY: 20,
  });

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotoUrl(student.photoUrl);
    const { x, y } = parsePos(student.photoPosition || 'center 20%');
    setPosX(x);
    setPosY(y);
    setZoom(student.photoZoom || 1);
    setShareToken(student.shareToken || student.id.slice(0, 8));
  }, [student]);

  // Attendance days local state
  const studentAttendanceDays = student.attendanceDays || [1, 5];

  const handleToggleDay = (dayIndex: number) => {
    let updated: number[];
    if (studentAttendanceDays.includes(dayIndex)) {
      if (studentAttendanceDays.length <= 1) {
        return; // Keep at least one day
      }
      updated = studentAttendanceDays.filter((d) => d !== dayIndex);
    } else {
      updated = [...studentAttendanceDays, dayIndex].sort((a, b) => a - b);
    }
    onUpdateStudentAttendanceDays(student.id, updated);
  };

  const handleSetPresetDays = (days: number[]) => {
    onUpdateStudentAttendanceDays(student.id, days);
  };

  // Direct Student Link with Token
  const getShareUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (familyId) url.searchParams.set('fam', familyId);
    url.searchParams.set('student', student.id);
    if (shareToken) url.searchParams.set('token', shareToken);
    return url.toString();
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Client-side Image Compression via HTML5 Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      reader.onerror = (err) => reject(err);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG quality 0.82
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedBase64);
      };

      img.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Photo file upload with 8MB size check and client compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size: Reject files > 8MB
    const MAX_SIZE_BYTES = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('Image file is too large (over 8MB). Please choose a smaller photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file);
      setPhotoUrl(compressedDataUrl);
      setShowPhotoControls(true);
      onUpdateStudentPhoto?.(student.id, compressedDataUrl, `${posX}% ${posY}%`, zoom);
    } catch {
      setFileError('An error occurred while processing the photo. Please try another file.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdatePositionAndZoom = (newX: number, newY: number, newZoom: number) => {
    const clampedX = Math.max(0, Math.min(100, Math.round(newX)));
    const clampedY = Math.max(0, Math.min(100, Math.round(newY)));
    const clampedZoom = Math.max(1.0, Math.min(2.5, Number(newZoom.toFixed(1))));

    setPosX(clampedX);
    setPosY(clampedY);
    setZoom(clampedZoom);

    if (photoUrl) {
      onUpdateStudentPhoto?.(student.id, photoUrl, `${clampedX}% ${clampedY}%`, clampedZoom);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    setShowPhotoControls(false);
    onUpdateStudentPhoto?.(student.id, undefined);
  };

  // Direct Drag-to-Reposition Gesture Handlers on Live Frame
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!photoUrl) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: posX,
      startY: posY,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !photoUrl) return;
    const deltaX = (e.clientX - dragStartRef.current.clientX) * 0.4;
    const deltaY = (e.clientY - dragStartRef.current.clientY) * 0.4;
    const nextX = dragStartRef.current.startX - deltaX;
    const nextY = dragStartRef.current.startY - deltaY;
    handleUpdatePositionAndZoom(nextX, nextY, zoom);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!photoUrl || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    const touch = e.touches[0];
    dragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      startX: posX,
      startY: posY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !photoUrl || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStartRef.current.clientX) * 0.4;
    const deltaY = (touch.clientY - dragStartRef.current.clientY) * 0.4;
    const nextX = dragStartRef.current.startX - deltaX;
    const nextY = dragStartRef.current.startY - deltaY;
    handleUpdatePositionAndZoom(nextX, nextY, zoom);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!photoUrl) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    handleUpdatePositionAndZoom(posX, posY, zoom + zoomDelta);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="student-settings-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none"
          dir="ltr"
        >
          {/* Modal Card */}
          <motion.div
            id="student-settings-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-lg bg-[#FAF6EE] text-[#1F2A3D] rounded-3xl shadow-2xl border border-[#B8860B]/35 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0E5C56] to-[#0A423E] text-[#F1E7CE] px-5 py-4 flex items-center justify-between border-b border-[#B8860B]/40 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-[#B8860B] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                  style={{ backgroundColor: student.color || '#0E5C56' }}
                >
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#F1E7CE] font-sans">
                      Student Settings
                    </h2>
                    <span className="text-xs bg-[#B8860B]/30 text-[#F1E7CE] px-2 py-0.5 rounded-full font-bold">
                      {student.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#B8860B] font-sans truncate">
                    {familyName} • Photo, Attendance Days & Direct Link
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                id="close-student-settings-btn"
                type="button"
                onClick={onClose}
                aria-label="Close Settings"
                className="p-1.5 rounded-lg text-[#F1E7CE] hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
              {/* =========================================================================
                  Section 1: Student Photo
                 ========================================================================= */}
              <section id="settings-section-photo" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Camera className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      Student Profile Photo
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E5C56] bg-[#0E5C56]/15 px-2.5 py-0.5 rounded-full">
                    Drag / Pinch to zoom
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3.5">
                  {/* File Error Notification */}
                  {fileError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {/* Portrait Live Preview with Direct Drag Support */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Portrait Frame Preview */}
                    <div className="flex flex-col items-center">
                      <div
                        ref={previewBoxRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onWheel={handleWheel}
                        className={`w-32 h-40 sm:w-36 sm:h-44 bg-white rounded-[22px] border-2 border-[#B8860B]/40 overflow-hidden shadow-sm flex flex-col shrink-0 select-none ${
                          photoUrl ? 'cursor-grab active:cursor-grabbing' : ''
                        }`}
                        title={photoUrl ? 'Drag photo directly to center, or use wheel to zoom' : ''}
                      >
                        <div className="relative flex-1 bg-gradient-to-b from-[#FAF6EE] to-[#EAE0CA] overflow-hidden flex items-center justify-center">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={student.name}
                              className="w-full h-full object-cover pointer-events-none"
                              style={{
                                objectPosition: `${posX}% ${posY}%`,
                                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center text-white"
                              style={{
                                background: `linear-gradient(135deg, ${student.color || '#0E5C56'}dd, ${student.color || '#0E5C56'})`,
                              }}
                            >
                              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold font-sans shadow-inner">
                                {student.name.charAt(0)}
                              </div>
                              <span className="text-[11px] text-white/90 font-sans mt-1">
                                {student.name}
                              </span>
                            </div>
                          )}

                          {photoUrl && (
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full pointer-events-none">
                              Drag to adjust
                            </div>
                          )}
                        </div>

                        <div className="py-1 px-1 text-center bg-white border-t border-amber-100/60">
                          <span className="font-bold text-xs text-[#B8860B] block truncate">
                            {student.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#5B6478] mt-1">
                        {photoUrl ? 'Drag to position face' : 'No photo uploaded yet'}
                      </span>
                    </div>

                    {/* Controls & Upload Button */}
                    <div className="flex-1 space-y-2.5 w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressing}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50"
                      >
                        {isCompressing ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin text-[#B8860B]" />
                            <span>Compressing photo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-[#B8860B]" />
                            <span>Choose Photo from Device</span>
                          </>
                        )}
                      </button>

                      {photoUrl && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPhotoControls(!showPhotoControls)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EAD3] border border-[#B8860B]/30 text-[#0E5C56] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#B8860B]" />
                            <span>{showPhotoControls ? 'Hide Sliders' : 'Fine-Tune Sliders'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            title="Remove photo and return to initial"
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-[#5B6478] leading-relaxed">
                        Photos are compressed locally for fast loading. Drag on the preview to position or adjust zoom below.
                      </p>
                    </div>
                  </div>

                  {/* Centering & Zoom Adjusters */}
                  {(showPhotoControls || photoUrl) && (
                    <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#B8860B]/20 space-y-3">
                      {/* Vertical Centering (Y-axis) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0E5C56] flex items-center gap-1">
                            <Move className="w-3.5 h-3.5 text-[#B8860B]" />
                            Vertical Center (Top / Bottom):
                          </span>
                          <span className="font-mono text-[#5B6478] font-semibold">{posY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={posY}
                          onChange={(e) =>
                            handleUpdatePositionAndZoom(posX, parseInt(e.target.value, 10), zoom)
                          }
                          className="w-full accent-[#0E5C56] cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-[#5B6478]">
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 10, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            Top (10%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 30, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            Mid-Top (30%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePositionAndZoom(posX, 50, zoom)}
                            className="px-2 py-0.5 rounded bg-white border border-[#B8860B]/20 hover:bg-[#F3EAD3]"
                          >
                            Center (50%)
                          </button>
                        </div>
                      </div>

                      {/* Zoom Slider */}
                      <div className="space-y-1 pt-1 border-t border-[#B8860B]/15">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0E5C56] flex items-center gap-1">
                            <ZoomIn className="w-3.5 h-3.5 text-[#B8860B]" />
                            Zoom Level:
                          </span>
                          <span className="font-mono text-[#5B6478] font-semibold">
                            {zoom.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.1"
                          value={zoom}
                          onChange={(e) =>
                            handleUpdatePositionAndZoom(posX, posY, parseFloat(e.target.value))
                          }
                          className="w-full accent-[#0E5C56] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* =========================================================================
                  Section 2: Weekly Attendance Days
                 ========================================================================= */}
              <section id="settings-section-attendance-days" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#0E5C56]">
                    <Calendar className="w-4.5 h-4.5 text-[#B8860B]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#0E5C56]">
                      Weekly Attendance Days
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#B8860B] bg-[#B8860B]/15 px-2.5 py-0.5 rounded-full">
                    {studentAttendanceDays.length} days/week
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#B8860B]/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <p className="text-[11.5px] sm:text-xs text-[#5B6478] font-medium leading-relaxed">
                    Select the days this student attends class:
                  </p>

                  {/* Weekdays Toggle Chips */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = studentAttendanceDays.includes(day.id);
                      return (
                        <button
                          key={`att-day-${day.id}`}
                          type="button"
                          onClick={() => handleToggleDay(day.id)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border shadow-2xs ${
                            isSelected
                              ? 'bg-[#0E5C56] text-[#F1E7CE] border-[#0E5C56] shadow-xs scale-102 ring-1 ring-[#0E5C56]'
                              : 'bg-[#FAF6EE] text-[#5B6478] border-[#B8860B]/20 hover:bg-[#F3EAD3]'
                          }`}
                        >
                          <span className="text-[10px] sm:text-[11px] leading-none">{day.short}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-[#B8860B]' : 'bg-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10.5px] font-bold text-[#5B6478]">Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([1, 5])}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 2 &&
                        studentAttendanceDays.includes(1) &&
                        studentAttendanceDays.includes(5)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      Mon + Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([0, 2, 4])}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 3 &&
                        studentAttendanceDays.includes(0) &&
                        studentAttendanceDays.includes(2) &&
                        studentAttendanceDays.includes(4)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      Sun + Tue + Thu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays([6, 1, 3])}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        studentAttendanceDays.length === 3 &&
                        studentAttendanceDays.includes(6) &&
                        studentAttendanceDays.includes(1) &&
                        studentAttendanceDays.includes(3)
                          ? 'bg-[#0E5C56] text-white border-[#0E5C56]'
                          : 'bg-[#FAF6EE] text-[#0E5C56] border-[#B8860B]/30 hover:bg-[#F3EAD3]'
                      }`}
                    >
                      Sat + Mon + Wed
                    </button>
                  </div>

                  {/* Summary of Active Days */}
                  <div className="pt-2.5 border-t border-[#B8860B]/15 flex items-center justify-between text-[11px] sm:text-xs text-[#0E5C56] bg-[#FAF6EE] px-3 py-2 rounded-xl">
                    <span className="font-semibold">Active Days:</span>
                    <span className="font-bold text-[#0E5C56]">
                      {getAttendanceDaysSummary(studentAttendanceDays)}
                    </span>
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  Section 3: Shareable Direct Link (Copy Link Only)
                 ========================================================================= */}
              <section id="settings-section-share-link" className="pt-1">
                <button
                  id="modal-copy-share-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.99] border ${
                    copiedLink
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] border-[#0E5C56]'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 text-[#B8860B]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-[#F5EFDD] border-t border-[#B8860B]/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#5B6478] font-medium">
                Changes saved automatically
              </span>
              <button
                id="done-student-settings-btn"
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-[#0E5C56] hover:bg-[#0A423E] text-[#F1E7CE] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
