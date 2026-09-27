import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

export interface DropdownOption<T> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badgeContent?: React.ReactNode;
  badgeStyle?: string;
}

interface CustomSelectDropdownProps<T> {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  title?: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  dir?: 'rtl' | 'ltr';
  idPrefix?: string;
}

export function CustomSelectDropdown<T>({
  isOpen,
  onClose,
  triggerRef,
  options,
  selectedValue,
  onSelect,
  title,
  width = 240,
  align = 'right',
  dir = 'rtl',
  idPrefix = 'custom-dropdown',
}: CustomSelectDropdownProps<T>) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(() => {
    const idx = options.findIndex((opt) => opt.value === selectedValue);
    return idx >= 0 ? idx : 0;
  });

  // Calculate & update coordinates based on trigger bounding rect
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current ? dropdownRef.current.offsetHeight : options.length * 44 + (title ? 42 : 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - width;
    } else if (align === 'center') {
      left = rect.left + (rect.width - width) / 2;
    }

    // Viewport horizontal clamping
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    const top = shouldOpenUpwards ? rect.top - dropdownHeight - 6 : rect.bottom + 6;

    setCoords({
      top: Math.max(10, Math.min(window.innerHeight - dropdownHeight - 10, top)),
      left,
      openUpwards: shouldOpenUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset highlighted index to selected value
    const idx = options.findIndex((opt) => opt.value === selectedValue);
    setHighlightedIndex(idx >= 0 ? idx : 0);

    // Initial position
    updatePosition();

    // Secondary position update after next tick to measure rendered height
    const timer = setTimeout(() => {
      updatePosition();
    }, 10);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (options[highlightedIndex]) {
          onSelect(options[highlightedIndex].value);
          onClose();
        }
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, selectedValue, options.length]);

  if (!isOpen || !coords) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      id={`${idPrefix}-popover`}
      role="listbox"
      aria-label={title || 'Select option'}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${width}px`,
        zIndex: 99999,
      }}
      className="bg-[#FDFBF7] rounded-2xl shadow-2xl border-2 border-[#B8860B]/40 p-1.5 font-sans select-none animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      dir={dir}
    >
      {title && (
        <div className="px-2.5 py-1.5 mb-1 border-b border-[#B8860B]/20 text-[11px] font-bold text-[#0E5C56] flex items-center justify-between">
          <span>{title}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {options.map((opt, index) => {
          const isSelected = opt.value === selectedValue;
          const isHighlighted = index === highlightedIndex;

          return (
            <button
              key={`${idPrefix}-opt-${index}`}
              role="option"
              aria-selected={isSelected}
              type="button"
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt.value);
                onClose();
              }}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-right ${
                isSelected
                  ? 'bg-[#FAF6EE] text-[#0E5C56] ring-1.5 ring-[#0E5C56]/40 shadow-2xs font-extrabold'
                  : isHighlighted
                  ? 'bg-black/5 text-[#1F2A3D]'
                  : 'text-[#1F2A3D] hover:bg-black/5'
              }`}
            >
              {/* Left/Start: Badge + Text Label */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {opt.badgeContent && (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border shadow-2xs shrink-0 select-none ${
                      opt.badgeStyle || 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {opt.badgeContent}
                  </span>
                )}
                <span className="truncate leading-snug">{opt.label}</span>
              </div>

              {/* Checkmark for Selected Option */}
              {isSelected ? (
                <Check className="w-4 h-4 text-[#0E5C56] stroke-[2.5] shrink-0" />
              ) : (
                <span className="w-4 h-4 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
