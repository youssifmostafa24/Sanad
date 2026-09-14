import React, { useState, useEffect } from 'react';
import { WifiOff, Database, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface OfflineIndicatorProps {
  isSupabaseConnected?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isSupabaseConnected }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasSupabase] = useState<boolean>(() => isSupabaseConfigured());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        id="offline-banner"
        dir="rtl"
        className="fixed bottom-14 left-3 sm:left-4 z-50 bg-black text-white text-[10.5px] font-semibold py-1 px-3 rounded-full border border-neutral-700 shadow-xl flex items-center gap-1.5 select-none"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
        <WifiOff className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
        <span>جاري محاولة الاتصال...</span>
      </div>
    );
  }

  // If Supabase is configured and connected
  if (hasSupabase && isSupabaseConnected) {
    return (
      <div
        id="supabase-status-pill"
        dir="rtl"
        title="البيانات متصلة سحابياً بقاعدة بيانات Supabase"
        className="fixed bottom-14 left-3 sm:left-4 z-40 bg-[#0E5C56]/90 text-[#F1E7CE] text-[10px] font-medium py-0.5 px-2.5 rounded-full border border-[#B8860B]/40 shadow-sm flex items-center gap-1.5 select-none backdrop-blur-xs opacity-75 hover:opacity-100 transition-opacity"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <Database className="w-3 h-3 text-[#B8860B] shrink-0" />
        <span>Supabase متصل</span>
      </div>
    );
  }

  return null;
};
