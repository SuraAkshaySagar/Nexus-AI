import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { Agent, Task, TaskEvent, AnalyticsOverview } from '../types';
import { KpiGrid } from '../components/overview/KpiGrid';
import { RecentTasksTable } from '../components/overview/RecentTasksTable';
import { ActivityFeed } from '../components/overview/ActivityFeed';
import { AgentNetwork3D } from '../components/three/AgentNetwork3D';
import { Fallback2DNetwork } from '../components/three/Fallback2DNetwork';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [use2D, setUse2D] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsData, tasksData, analyticsData] = await Promise.all([
        api.getAgents(),
        api.getTasks({ limit: 8 } as any),
        api.getAnalytics(),
      ]);

      setAgents(agentsData);
      setTasks(tasksData);
      setAnalytics(analyticsData);

      // Collect real events from the most recent task if available
      if (tasksData.length > 0) {
        try {
          const detail = await api.getTask(tasksData[0].id);
          if (detail.events) {
            setEvents(detail.events);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Action Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#101b33] to-[#12162b] border border-cyan-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
              NEXUS Core Swarm
            </span>
            <span className="text-xs text-slate-400 font-mono">Lyzr Studio & Qdrant Active</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Collaborative Multi-Agent Orchestration
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous Manager Agent coordinating specialized research, architectural, and planning agents with shared Qdrant vector memory and Omi voice intelligence.
          </p>
        </div>

        <button
          onClick={() => navigate('/orchestrator')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Orchestration</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards */}
      <KpiGrid analytics={analytics} loading={loading} />

      {/* Central 3D Interactive Topology & Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Live Multi-Agent Mesh Topology
              </h2>
              <p className="text-[11px] text-slate-400">
                Interactive spatial visualization of Manager and Specialist Agent nodes
              </p>
            </div>
            <button
              onClick={() => setUse2D(!use2D)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 transition-colors"
            >
              {use2D ? 'Switch to 3D View' : 'Switch to 2D Fallback'}
            </button>
          </div>

          {use2D ? (
            <Fallback2DNetwork
              agents={agents}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
            />
          ) : (
            <AgentNetwork3D
              agents={agents}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
              onToggle2D={() => setUse2D(true)}
            />
          )}
        </div>

        {/* Real-time Activity Telemetry Feed */}
        <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Execution Activity</h3>
              <p className="text-[10px] text-slate-400">Verified backend telemetry events</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 glow-cyan animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px]">
            <ActivityFeed events={events} loading={loading} />
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Recent Orchestration Tasks</h3>
            <p className="text-[11px] text-slate-400">Execution workflows triggered via Dashboard or Omi voice notes</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <RecentTasksTable tasks={tasks} loading={loading} />
      </div>

      {/* Agent Details Modal when 3D node is clicked */}
      <Modal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent ? selectedAgent.name : 'Agent Telemetry'}
      >
        {selectedAgent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20">
              <div>
                <p className="text-slate-400 text-[11px]">Role & Specialization</p>
                <p className="font-semibold text-slate-200 text-sm">{selectedAgent.role}</p>
              </div>
              <StatusBadge status={selectedAgent.status} />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 leading-relaxed">
              {selectedAgent.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Total Invocations</span>
                <p className="text-base font-bold text-slate-100 mt-0.5">{selectedAgent.total_executions}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Successful Runs</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{selectedAgent.successful_executions}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Avg Response Time</span>
                <p className="text-base font-bold text-cyan-400 mt-0.5">
                  {selectedAgent.avg_response_time_ms > 0 ? `${selectedAgent.avg_response_time_ms.toFixed(0)}ms` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[11px]">
                Lyzr Agent ID: {selectedAgent.lyzr_agent_id || 'Configured via Manager Framework'}
              </span>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  navigate('/agents');
                }}
                className="text-cyan-400 hover:underline text-[11px] font-medium"
              >
                Configure in Agent Network →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
