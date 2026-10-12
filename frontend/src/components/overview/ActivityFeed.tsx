import React from 'react';
import { Database, Bot, CheckCircle, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';
import { TaskEvent } from '../../types';

interface ActivityFeedProps {
  events: TaskEvent[];
  loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, loading = false }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'memory_retrieval_started':
      case 'memory_retrieved':
        return { icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
      case 'agent_invoked':
      case 'agent_started':
        return { icon: Bot, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
      case 'agent_output':
        return { icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'review_started':
      case 'review_completed':
        return { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'final_answer_delivered':
        return { icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/10' };
      case 'error':
        return { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' };
      default:
        return { icon: Bot, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-900/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs">
        No recent swarm telemetry events logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 8).map((event) => {
        const { icon: Icon, color, bg } = getEventIcon(event.event_type);
        const timeStr = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '';

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0d1629]/70 border border-slate-800/80 hover:border-cyan-500/25 transition-all text-xs"
          >
            <div className={`p-2 rounded-lg ${bg} flex-shrink-0 mt-0.5`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-200 truncate">
                  {event.agent_name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{timeStr}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {event.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
