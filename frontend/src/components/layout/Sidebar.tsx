import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Sparkles,
  Activity,
  Database,
  Mic,
  BarChart3,
  History,
  Cpu,
  Settings,
  Bot,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/agents', label: 'Agent Network', icon: Network },
  { path: '/orchestrator', label: 'Task Orchestrator', icon: Sparkles },
  { path: '/execution', label: 'Live Execution', icon: Activity },
  { path: '/memory', label: 'Shared Memory', icon: Database },
  { path: '/voice', label: 'Voice Intelligence', icon: Mic },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/history', label: 'Execution History', icon: History },
  { path: '/integrations', label: 'Integrations', icon: Cpu },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#080d19] border-r border-cyan-500/15 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-cyan-500/15 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-wider text-slate-100">NEXUS</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Multi-Agent Swarm OS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          Platform Systems
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status Card */}
      <div className="p-3.5 border-t border-cyan-500/15 bg-[#0a1122]/60">
        <div className="p-3 rounded-xl bg-[#0e172a] border border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 glow-cyan animate-pulse" />
            <div>
              <p className="text-[11px] font-medium text-slate-200">Swarm Active</p>
              <p className="text-[9px] text-slate-400">Autonomous Orchestration</p>
            </div>
          </div>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
    </aside>
  );
};
