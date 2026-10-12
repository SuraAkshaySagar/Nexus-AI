import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { Modal } from './components/ui/Modal';
import { api } from './services/api';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { AgentNetworkPage } from './pages/AgentNetworkPage';
import { TaskOrchestratorPage } from './pages/TaskOrchestratorPage';
import { LiveExecutionPage } from './pages/LiveExecutionPage';
import { SharedMemoryPage } from './pages/SharedMemoryPage';
import { VoiceIntelligencePage } from './pages/VoiceIntelligencePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickCategory, setQuickCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    try {
      setSubmitting(true);
      const task = await api.createTask({
        prompt: quickPrompt.trim(),
        category: quickCategory as any,
        orchestration_mode: 'manager_guided',
        priority: 'normal',
        save_to_memory: true,
      });
      setQuickTaskOpen(false);
      setQuickPrompt('');
      navigate(`/execution?taskId=${task.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to launch task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070B14] text-slate-100 font-sans bg-cyber-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onOpenNewTaskModal={() => setQuickTaskOpen(true)} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/agents" element={<AgentNetworkPage />} />
            <Route path="/orchestrator" element={<TaskOrchestratorPage />} />
            <Route path="/execution" element={<LiveExecutionPage />} />
            <Route path="/memory" element={<SharedMemoryPage />} />
            <Route path="/voice" element={<VoiceIntelligencePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<ExecutionHistoryPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      {/* Quick Launch Task Modal */}
      <Modal
        isOpen={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
        title="Launch New Multi-Agent Task"
      >
        <form onSubmit={handleQuickSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Task Prompt / Instruction
            </label>
            <textarea
              rows={4}
              required
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="e.g. Conduct comparative benchmark between vector indexing algorithms in Qdrant..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Domain Category
            </label>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="General">General Multi-Step</option>
              <option value="Research">Research</option>
              <option value="Architecture">Software Architecture</option>
              <option value="Planning">Project Planning</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setQuickTaskOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20"
            >
              {submitting ? 'Launching...' : 'Execute Swarm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
