import React, { useEffect, useMemo } from 'react';
import { Home, BookOpen, BarChart2, Play, Target } from 'lucide-react';
import { StudentTopNavTab } from '../types';

interface TopNavGridBarProps {
  activeTab: StudentTopNavTab;
  onSelectTab: (tab: StudentTopNavTab) => void;
  visibleTabs?: StudentTopNavTab[];
  unreadNotesCount?: number;
}

interface NavTabConfig {
  id: StudentTopNavTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const ALL_TABS: NavTabConfig[] = [
  { id: 'homework', label: 'Homework', icon: Home },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: BarChart2 },
  { id: 'videos', label: 'Videos', icon: Play },
  { id: 'notes', label: 'Notes', icon: Target },
];

export const TopNavGridBar: React.FC<TopNavGridBarProps> = ({
  activeTab,
  onSelectTab,
  visibleTabs,
  unreadNotesCount = 0,
}) => {
  // Filter tabs according to per-student visibleTabs configuration if provided
  const effectiveTabs = useMemo(() => {
    if (!visibleTabs || visibleTabs.length === 0) {
      return ALL_TABS;
    }
    return ALL_TABS.filter((t) => visibleTabs.includes(t.id));
  }, [visibleTabs]);

  // If the active tab becomes hidden, automatically switch to the first visible one
  useEffect(() => {
    if (effectiveTabs.length > 0 && !effectiveTabs.some((t) => t.id === activeTab)) {
      onSelectTab(effectiveTabs[0].id);
    }
  }, [effectiveTabs, activeTab, onSelectTab]);

  // If only one tab is visible, hide the bar entirely
  if (effectiveTabs.length <= 1) {
    return null;
  }

  // Dynamic grid columns based on number of visible tabs (default: 5 equal columns)
  const gridColsClass =
    effectiveTabs.length === 5
      ? 'grid-cols-5'
      : effectiveTabs.length === 4
      ? 'grid-cols-4'
      : effectiveTabs.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2';

  return (
    <nav
      id="top-nav-grid-bar"
      role="tablist"
      aria-label="App Navigation"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: '#1F5A4E',
      }}
      className="shrink-0 w-full z-40 select-none shadow-md"
      dir="ltr"
    >
      <div className="w-full max-w-2xl mx-auto h-14 px-1 flex items-center justify-center">
        <div className={`grid ${gridColsClass} w-full h-full items-center`}>
          {effectiveTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                id={`top-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center h-full cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-transform active:scale-95 group"
              >
                {/* Icon Container: 52x30px rounded pill on active, transparent on inactive */}
                <div
                  className={`w-[52px] h-[30px] rounded-full flex items-center justify-center relative transition-all duration-150 ${
                    isActive ? 'bg-white/20 shadow-xs' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/72 group-hover:text-white'
                    }`}
                  />

                  {/* Red unread-count badge on Notes tab (hidden when 0) */}
                  {tab.id === 'notes' && unreadNotesCount > 0 && (
                    <span
                      id="notes-unread-badge"
                      aria-label={`${unreadNotesCount} unread notes`}
                      className="absolute -top-1 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white font-sans font-extrabold text-[9px] min-w-[17px] leading-none text-center shadow-xs ring-1 ring-white/60 pointer-events-none"
                    >
                      {unreadNotesCount}
                    </span>
                  )}
                </div>

                {/* Short Label: 11px font size */}
                <span
                  className={`text-[11px] leading-tight tracking-tight mt-0.5 transition-colors duration-150 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-white/72 font-medium group-hover:text-white'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
