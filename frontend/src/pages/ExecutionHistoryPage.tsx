import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  History, Search, Filter, Download, ArrowUpRight, 
  Trash2, FileJson, FileText, CheckCircle2, Clock, Mic, Layout 
} from 'lucide-react';
import { api } from '../services/api';
import { Task } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const ExecutionHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearch = searchParams.get('search') || '';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const exportAsJson = (task: Task) => {
    const blob = new Blob([JSON.stringify(task, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-task-${task.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = (task: Task) => {
    const md = `# NEXUS Task Execution Report
**Task ID**: ${task.id}
**Created**: ${task.created_at}
**Status**: ${task.status}
**Duration**: ${task.duration_seconds}s
**Source**: ${task.source}

## Objective
${task.prompt}

## Synthesis Result
${task.final_result || 'No final output recorded.'}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-task-${task.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task from history?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">Execution Task History</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete audit trail of multi-agent runs, memory retrievals, and synthesized answers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or prompt keyword..."
            className="w-full bg-[#080d19] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="executing">Executing</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Categories</option>
            <option value="Architecture">Architecture</option>
            <option value="Research">Research</option>
            <option value="Planning">Planning</option>
            <option value="General">General</option>
          </select>

          <button
            onClick={loadTasks}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
        {tasks.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No matching tasks found. Adjust search filters or initiate a new orchestration.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cyan-500/15 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Task Title & Prompt</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors max-w-xs truncate">
                        {task.title || task.prompt}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {task.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{task.category}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        {task.source === 'omi_voice' ? <Mic className="w-3 h-3 text-violet-400" /> : <Layout className="w-3 h-3 text-cyan-400" />}
                        <span>{task.source.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {task.duration_seconds > 0 ? `${task.duration_seconds}s` : '--'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => exportAsJson(task)}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                          title="Export JSON"
                        >
                          <FileJson className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportAsMarkdown(task)}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                          title="Export Markdown"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Inspection Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? selectedTask.title || 'Task Details' : ''}
        maxWidth="max-w-3xl"
      >
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-slate-500 text-[10px] font-mono">TASK ID: {selectedTask.id}</p>
                <p className="text-slate-300 text-xs mt-0.5">
                  Category: {selectedTask.category} • Mode: {selectedTask.orchestration_mode}
                </p>
              </div>
              <StatusBadge status={selectedTask.status} />
            </div>

            <div>
              <p className="text-slate-400 font-semibold mb-1">Prompt / Objective:</p>
              <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-slate-200">
                {selectedTask.prompt}
              </div>
            </div>

            {selectedTask.final_result && (
              <div>
                <p className="text-slate-400 font-semibold mb-1">Synthesized Report:</p>
                <div className="p-4 rounded-xl bg-[#080d19] border border-emerald-500/30 text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {selectedTask.final_result}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => navigate(`/execution?taskId=${selectedTask.id}`)}
                className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open in Live Execution View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAsJson(selectedTask)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportAsMarkdown(selectedTask)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                >
                  Export Markdown
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
