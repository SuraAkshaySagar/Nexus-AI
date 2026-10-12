import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const norm = status.toLowerCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotBg = 'bg-slate-400';
  let label = status;

  if (norm === 'connected' || norm === 'completed') {
    bg = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    dotBg = 'bg-emerald-400';
  } else if (norm === 'running' || norm === 'executing' || norm === 'retrieving_memory' || norm === 'planning' || norm === 'reviewing') {
    bg = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
    dotBg = 'bg-cyan-400';
  } else if (norm === 'failed' || norm === 'error') {
    bg = 'bg-red-950/60 text-red-300 border-red-500/40';
    dotBg = 'bg-red-400';
  } else if (norm === 'not_configured' || norm === 'waiting') {
    bg = 'bg-slate-900/80 text-slate-400 border-slate-700/50';
    dotBg = 'bg-slate-500';
    if (norm === 'not_configured') label = 'Not Configured';
  } else if (norm === 'degraded' || norm === 'pending') {
    bg = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    dotBg = 'bg-amber-400';
  } else if (norm === 'idle') {
    bg = 'bg-blue-950/40 text-blue-300 border-blue-500/20';
    dotBg = 'bg-blue-400';
  }

  const isPulsing = pulse || norm === 'running' || norm === 'executing' || norm === 'reviewing';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotBg} ${isPulsing ? 'animate-ping' : ''}`} />
      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
    </span>
  );
};
