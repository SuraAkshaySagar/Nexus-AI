import React, { useState, useEffect } from 'react';
import { Bot, Plus, CheckCircle, AlertCircle, Clock, Zap, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const AgentNetworkPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [testResultModalOpen, setTestResultModalOpen] = useState(false);
  const [activeTestResult, setActiveTestResult] = useState<any>(null);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);

  // Form for registering new agent ID
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    lyzr_agent_id: '',
    is_manager: false,
  });

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (e) {
      console.error('Failed to load agents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleToggleEnable = async (agent: Agent) => {
    try {
      const updated = await api.updateAgent(agent.id, { enabled: !agent.enabled });
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestAgent = async (agent: Agent) => {
    try {
      setTestingAgentId(agent.id);
      const res = await api.testAgent(agent.id);
      setActiveTestResult(res);
      setTestResultModalOpen(true);
    } catch (e: any) {
      setActiveTestResult({
        agent_name: agent.name,
        success: false,
        status: 'failed',
        message: e.message || 'Network error testing agent',
      });
      setTestResultModalOpen(true);
    } finally {
      setTestingAgentId(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAgent = await api.registerAgent(formData);
      setAgents((prev) => [...prev, newAgent]);
      setRegisterModalOpen(false);
      setFormData({ name: '', role: '', description: '', lyzr_agent_id: '', is_manager: false });
    } catch (e) {
      console.error(e);
      alert('Failed to register agent');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>Agent Network Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Lyzr Agent Studio specialists, inspect routing policies, and monitor execution latencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAgents}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
            title="Refresh Agents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Lyzr Agent ID</span>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const isTesting = testingAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl bg-[#0b1324] border ${
                agent.is_manager ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-slate-800'
              } flex flex-col justify-between shadow-xl hover:border-cyan-500/35 transition-all relative overflow-hidden`}
            >
              {agent.is_manager && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500/30 to-transparent px-3 py-1 rounded-bl-xl border-l border-b border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  Swarm Manager
                </div>
              )}

              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        agent.is_manager
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm leading-snug">{agent.name}</h3>
                      <p className="text-[11px] text-cyan-400 font-medium">{agent.role}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge status={agent.status} size="sm" />
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      agent.enabled
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {agent.enabled ? 'Routing Active' : 'Routing Disabled'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                  {agent.description}
                </p>

                {/* Identifiers */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lyzr Agent ID:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">
                      {agent.lyzr_agent_id ? `${agent.lyzr_agent_id.slice(0, 10)}...` : 'Manager Native'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Node ID:</span>
                    <span className="text-slate-400">{agent.id}</span>
                  </div>
                </div>
              </div>

              {/* Metrics & Action Bar */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/40">
                    <p className="text-[10px] text-slate-500">Runs</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{agent.total_executions}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/40">
                    <p className="text-[10px] text-slate-500">Success</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">{agent.successful_executions}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/40">
                    <p className="text-[10px] text-slate-500">Latency</p>
                    <p className="text-xs font-bold text-cyan-400 mt-0.5">
                      {agent.avg_response_time_ms > 0 ? `${agent.avg_response_time_ms.toFixed(0)}ms` : '--'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestAgent(agent)}
                    disabled={isTesting}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleEnable(agent)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      agent.enabled
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {agent.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register New Lyzr Agent ID */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Lyzr Agent ID"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Agent Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. NEXUS Compliance Auditor"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Role / Specialization</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Compliance & Safety Agent"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Official Lyzr Agent Studio Agent ID</label>
            <input
              type="text"
              required
              value={formData.lyzr_agent_id}
              onChange={(e) => setFormData({ ...formData, lyzr_agent_id: e.target.value })}
              placeholder="e.g. 660f9a2b8e3128490a149c"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Obtained directly from your Lyzr Agent Studio dashboard.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Role Description & Capabilities</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain what prompts this specialist handles and how it contributes to swarm execution..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_manager"
              checked={formData.is_manager}
              onChange={(e) => setFormData({ ...formData, is_manager: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="is_manager" className="text-slate-300">
              Configure as Swarm Manager (coordinates other agents)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20"
            >
              Register Agent
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Test Ping Result */}
      <Modal
        isOpen={testResultModalOpen}
        onClose={() => setTestResultModalOpen(false)}
        title="Agent Connection Test Result"
      >
        {activeTestResult && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <p className="text-slate-400 text-[11px]">Tested Agent</p>
                <p className="font-semibold text-slate-100 text-sm">{activeTestResult.agent_name}</p>
              </div>
              <StatusBadge status={activeTestResult.status} />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-slate-400 text-[11px] mb-1">Status Message</p>
              <p className="text-slate-200 font-mono text-[11px]">{activeTestResult.message}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Response Latency:</span>
              <span className="font-mono text-cyan-400 font-bold">
                {activeTestResult.response_time_ms > 0 ? `${activeTestResult.response_time_ms}ms` : 'N/A'}
              </span>
            </div>

            {activeTestResult.raw_response && (
              <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(activeTestResult.raw_response, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
