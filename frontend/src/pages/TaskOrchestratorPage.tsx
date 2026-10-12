import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Database, ShieldCheck, Zap, Layers, FileText, BrainCircuit } from 'lucide-react';
import { api } from '../services/api';
import { TaskCategory, OrchestrationMode, TaskPriority } from '../types';

const PRESETS = [
  {
    category: 'Architecture',
    title: 'High-Throughput Vector Consensus',
    prompt: 'Design a distributed consensus topology for real-time vector memory synchronization across 5 global regions with <15ms p99 latency.',
  },
  {
    category: 'Research',
    title: 'Agentic Tool-Use Verification',
    prompt: 'Conduct deep inquiry into sandboxed execution patterns for LLM agent function calls to eliminate arbitrary remote code vulnerabilities.',
  },
  {
    category: 'Planning',
    title: 'Multi-Agent Production Migration',
    prompt: 'Formulate an end-to-end phased rollout roadmap for deploying autonomous Lyzr agents with fallback failovers and continuous eval benchmarks.',
  },
];

export const TaskOrchestratorPage: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<TaskCategory>('General');
  const [mode, setMode] = useState<OrchestrationMode>('manager_guided');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [saveToMemory, setSaveToMemory] = useState(true);
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 5) {
      setError('Please enter a descriptive prompt (at least 5 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const task = await api.createTask({
        prompt: prompt.trim(),
        category,
        orchestration_mode: mode,
        priority,
        context: context.trim() || undefined,
        save_to_memory: saveToMemory,
        source: 'dashboard',
      });

      // Navigate to live execution page for real-time monitoring
      navigate(`/execution?taskId=${task.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setCategory(preset.category as TaskCategory);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
          <h1 className="text-xl font-bold text-slate-100">Task Orchestrator</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Submit complex objectives. The Manager Agent will retrieve relevant Qdrant vector memories, delegate across specialists, and enforce quality audits.
        </p>
      </div>

      {/* Suggested Quick Presets */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Architecture Presets</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl bg-[#0b1324] border border-cyan-500/15 hover:border-cyan-400 text-left transition-all group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  {preset.category}
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">Apply</span>
              </div>
              <p className="text-xs font-medium text-slate-200 mt-2 group-hover:text-cyan-300 transition-colors">
                {preset.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-2xl space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Mission Objective / Task Prompt
          </label>
          <textarea
            rows={5}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the multi-agent task or paste specifications. e.g. Evaluate microservices versus modular monolithic topologies for NEXUS..."
            className="w-full bg-[#080d19] border border-cyan-500/25 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all leading-relaxed"
          />
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Domain Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="General">General Multi-Step</option>
              <option value="Research">Deep Domain Research</option>
              <option value="Architecture">Software & System Architecture</option>
              <option value="Planning">Strategic Implementation Planning</option>
              <option value="Analysis">Document & Code Analysis</option>
            </select>
          </div>

          {/* Orchestration Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Orchestration Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as OrchestrationMode)}
              className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="manager_guided">Manager Guided (Lyzr Coordinator)</option>
              <option value="autonomous">Autonomous Swarm</option>
              <option value="hierarchical">Hierarchical Delegation</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Execution Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="normal">Normal SLA</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical / Low Latency</option>
            </select>
          </div>
        </div>

        {/* Optional Context */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Optional Supplementary Context
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Reference previous task IDs, architecture constraints, or API keys..."
            className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Toggles */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToMemory}
              onChange={(e) => setSaveToMemory(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Persist verified outputs into Qdrant Shared Vector Memory</span>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching Swarm Workflow...' : 'Execute Multi-Agent Pipeline'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
