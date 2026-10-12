import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle, Clock, Bot, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

const COLORS = ['#36D9FF', '#9B7CFF', '#10B981', '#F59E0B', '#EC4899'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">Swarm Telemetry & Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real historical orchestration metrics, agent execution distributions, and daily workflow trends.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Stat Summary Grid */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
            <span className="text-[11px] text-slate-500 font-medium">Total Workflows</span>
            <p className="text-2xl font-bold text-slate-100 mt-1">{data.total_tasks}</p>
            <p className="text-[10px] text-cyan-400 mt-1">Completed & In-flight</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
            <span className="text-[11px] text-slate-500 font-medium">Verification Rating</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{data.success_rate}%</p>
            <p className="text-[10px] text-slate-400 mt-1">Quality review pass rate</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
            <span className="text-[11px] text-slate-500 font-medium">Avg Execution Latency</span>
            <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{data.avg_duration}s</p>
            <p className="text-[10px] text-slate-400 mt-1">End-to-end swarm cycle</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
            <span className="text-[11px] text-slate-500 font-medium">Active Specialists</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{data.agents_metrics?.length || 5}</p>
            <p className="text-[10px] text-slate-400 mt-1">Lyzr integrated nodes</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Execution Volume */}
        <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Daily Workflow Execution Volume</h3>
              <p className="text-[11px] text-slate-400">Total submitted tasks vs completed over the last 7 days</p>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-64 pt-2">
            {data && data.daily_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_trends}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#36D9FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#36D9FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#36D9FF" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" name="Total Tasks" />
                  <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fillOpacity={0} fill="#10B981" name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No historical workflow volume yet.
              </div>
            )}
          </div>
        </div>

        {/* Task Category Distribution */}
        <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Domain Category Breakdown</h3>
              <p className="text-[11px] text-slate-400">Distribution across Research, Architecture, and Planning</p>
            </div>
          </div>

          <div className="h-64 pt-2 flex items-center justify-center">
            {data && data.category_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.category_distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs">No categorized tasks recorded.</div>
            )}
          </div>
        </div>

        {/* Agent Invocations Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Specialist Agent Workload Distribution</h3>
              <p className="text-[11px] text-slate-400">Total runs per registered agent node</p>
            </div>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>

          <div className="h-64 pt-2">
            {data && data.agents_metrics && data.agents_metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.agents_metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickFormatter={(name) => name.replace('NEXUS ', '')} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="total_executions" fill="#36D9FF" radius={[6, 6, 0, 0]} name="Total Invocations" />
                  <Bar dataKey="successful_executions" fill="#10B981" radius={[6, 6, 0, 0]} name="Successful Runs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No agent executions logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
