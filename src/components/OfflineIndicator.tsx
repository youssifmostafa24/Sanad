import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

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

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      dir="rtl"
      className="fixed bottom-14 left-3 sm:left-4 z-50 bg-black text-white text-[10.5px] font-semibold py-1 px-3 rounded-full border border-neutral-700 shadow-xl flex items-center gap-1.5 select-none"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
      <WifiOff className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
      <span>جاري محاولة الاتصال...</span>
    </div>
  );
};
