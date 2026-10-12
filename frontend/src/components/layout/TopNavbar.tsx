import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { IntegrationsStatus } from '../../types';

interface TopNavbarProps {
  onOpenNewTaskModal?: () => void;
  onSearch?: (query: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenNewTaskModal, onSearch }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getIntegrationsStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to load system status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchVal);
    } else {
      navigate(`/history?search=${encodeURIComponent(searchVal)}`);
    }
  };

  const renderServicePill = (name: string, service?: { status: string; is_configured: boolean }) => {
    if (!service) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>{name}: Checking</span>
        </div>
      );
    }

    let dotColor = 'bg-slate-500';
    let textColor = 'text-slate-400';
    let borderColor = 'border-slate-800';
    let label = 'Not Configured';

    if (service.status === 'connected') {
      dotColor = 'bg-emerald-400';
      textColor = 'text-emerald-300';
      borderColor = 'border-emerald-500/30';
      label = 'Connected';
    } else if (service.status === 'failed') {
      dotColor = 'bg-red-400';
      textColor = 'text-red-300';
      borderColor = 'border-red-500/30';
      label = 'Failed';
    } else if (service.status === 'degraded') {
      dotColor = 'bg-amber-400';
      textColor = 'text-amber-300';
      borderColor = 'border-amber-500/30';
      label = 'Degraded';
    } else if (service.status === 'not_configured') {
      dotColor = 'bg-slate-500';
      textColor = 'text-slate-400';
      borderColor = 'border-slate-800';
      label = 'Not Configured';
    }

    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a1122]/90 border ${borderColor} text-[11px] font-medium ${textColor} cursor-pointer hover:border-cyan-500/40 transition-colors`}
        onClick={() => navigate('/integrations')}
        title={`${name}: ${label} (${service.status})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${service.status === 'connected' ? 'animate-pulse' : ''}`} />
        <span className="text-slate-300">{name}:</span>
        <span className="capitalize">{label}</span>
      </div>
    );
  };

  return (
    <header className="h-16 bg-[#080d19]/80 backdrop-blur-md border-b border-cyan-500/15 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-80 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search orchestration tasks or memories..."
          className="w-full bg-[#0d1629] border border-cyan-500/20 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
        />
      </form>

      {/* Global Connection Status Indicators */}
      <div className="hidden lg:flex items-center gap-2">
        {renderServicePill('Backend', status?.backend)}
        {renderServicePill('Lyzr', status?.lyzr)}
        {renderServicePill('Qdrant', status?.qdrant)}
        {renderServicePill('Omi', status?.omi)}

        <button
          onClick={loadStatus}
          title="Refresh Integration States"
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors ml-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/history')}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors relative"
          title="Activity Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </button>

        <button
          onClick={onOpenNewTaskModal || (() => navigate('/orchestrator'))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Start New Task</span>
        </button>
      </div>
    </header>
  );
};
