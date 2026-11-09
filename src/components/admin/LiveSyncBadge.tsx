import React from 'react';
import { Radio } from 'lucide-react';

interface LiveSyncBadgeProps {
  label?: string;
  className?: string;
}

export function LiveSyncBadge({ label = 'Live Sync', className = '' }: LiveSyncBadgeProps) {
  return (
    <div
      title="Real-time updates active via Supabase"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{label}</span>
    </div>
  );
}

export default LiveSyncBadge;

