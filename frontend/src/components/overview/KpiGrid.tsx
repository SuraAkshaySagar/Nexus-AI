import React from 'react';
import { CheckCircle2, Clock, PlayCircle, AlertTriangle, Layers, Percent } from 'lucide-react';
import { AnalyticsOverview } from '../../types';

interface KpiGridProps {
  analytics: AnalyticsOverview | null;
  loading: boolean;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ analytics, loading }) => {
  const cards = [
    {
      title: 'Total Tasks',
      value: analytics ? analytics.total_tasks : 0,
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      sub: 'All swarm invocations',
    },
    {
      title: 'Active Workflows',
      value: analytics ? analytics.active_tasks : 0,
      icon: PlayCircle,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      sub: 'In-flight multi-agent runs',
    },
    {
      title: 'Completed Tasks',
      value: analytics ? analytics.completed_tasks : 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      sub: 'Consolidated answers delivered',
    },
    {
      title: 'Failed Tasks',
      value: analytics ? analytics.failed_tasks : 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      sub: 'Terminated or network errors',
    },
    {
      title: 'Avg Duration',
      value: analytics ? `${analytics.avg_duration}s` : '0.0s',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      sub: 'Pipeline traversal latency',
    },
    {
      title: 'Success Rate',
      value: analytics ? `${analytics.success_rate}%` : '100%',
      icon: Percent,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      sub: 'Quality verification rating',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#0b1324] border border-cyan-500/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl bg-[#0b1324] border ${card.borderColor} flex flex-col justify-between hover:border-cyan-500/35 transition-all shadow-lg shadow-black/20`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">{card.title}</span>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold text-slate-100 tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
