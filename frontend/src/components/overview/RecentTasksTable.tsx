import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Mic, Layout, Clock } from 'lucide-react';
import { Task } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

interface RecentTasksTableProps {
  tasks: Task[];
  loading: boolean;
}

export const RecentTasksTable: React.FC<RecentTasksTableProps> = ({ tasks, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-900/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-xs">
        No recent orchestration tasks recorded. Submit a prompt or trigger an Omi voice note.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-cyan-500/15 text-slate-500 uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Task & Objective</th>
            <th className="py-3 px-3">Source</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Assigned Swarm</th>
            <th className="py-3 px-3">Duration</th>
            <th className="py-3 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {tasks.slice(0, 6).map((task) => {
            const isVoice = task.source === 'omi_voice';
            return (
              <tr
                key={task.id}
                onClick={() => navigate(`/execution?taskId=${task.id}`)}
                className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors max-w-xs truncate">
                    {task.title || task.prompt}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {task.id.slice(0, 8)}... • {task.category}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                    {isVoice ? (
                      <>
                        <Mic className="w-3.5 h-3.5 text-violet-400" />
                        <span>Omi Voice</span>
                      </>
                    ) : (
                      <>
                        <Layout className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Dashboard</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={task.status} size="sm" />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                    {task.assigned_agents.length > 0 ? (
                      task.assigned_agents.map((agent, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[9px] text-slate-400"
                        >
                          {agent.replace('NEXUS ', '').replace(' Agent', '')}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[10px]">Manager</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{task.duration_seconds > 0 ? `${task.duration_seconds}s` : '--'}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/execution?taskId=${task.id}`);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors inline-flex items-center gap-0.5"
                  >
                    <span className="text-[10px] font-medium">Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
