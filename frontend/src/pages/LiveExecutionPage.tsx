import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Activity, RotateCcw, Database, Bot, CheckCircle2, 
  AlertCircle, Clock, Sparkles, Copy, Check, ChevronDown, ChevronRight, Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { Task, TaskEvent } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

export const LiveExecutionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskId = searchParams.get('taskId');

  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load task metadata
  const loadTask = async (id: string) => {
    try {
      const data = await api.getTask(id);
      setTask(data);
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to load task', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!taskId) {
      // If no taskId in URL, fetch the latest task
      api.getTasks({ limit: 1 } as any).then((tasks) => {
        if (tasks.length > 0) {
          navigate(`/execution?taskId=${tasks[0].id}`, { replace: true });
        } else {
          setLoading(false);
        }
      });
      return;
    }

    loadTask(taskId);

    // Setup Server-Sent Events (SSE) for live stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/v1/tasks/${taskId}/events`);
    eventSourceRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.event_type === 'stream_end') {
          sse.close();
          loadTask(taskId);
          return;
        }

        setEvents((prev) => {
          // Avoid duplicate events by ID
          if (prev.some((item) => item.id === parsed.id)) {
            return prev;
          }
          return [...prev, parsed];
        });

        // Refresh task status if completion or error
        if (['final_answer_delivered', 'error', 'task_completed'].includes(parsed.event_type)) {
          loadTask(taskId);
        }
      } catch (err) {
        console.error('Error parsing SSE event', err);
      }
    };

    sse.onerror = () => {
      // Close on error and fallback to polling
      sse.close();
    };

    return () => {
      if (sse) sse.close();
    };
  }, [taskId]);

  const handleRetry = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      await api.retryTask(taskId);
      loadTask(taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEventExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyResult = () => {
    if (task?.final_result) {
      navigator.clipboard.writeText(task.final_result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!taskId && !loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <Activity className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-semibold text-slate-300">No Task Selected</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Select a task from History or submit a new objective in Task Orchestrator.
        </p>
        <button
          onClick={() => navigate('/orchestrator')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
        >
          Launch New Task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Task Metadata */}
      {task && (
        <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100">{task.title || 'Multi-Agent Task'}</h1>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ID: {task.id} • Initiated via {task.source.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <StatusBadge status={task.status} pulse={task.status === 'executing'} />
              {task.status === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
            {task.prompt}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] text-slate-500">Category</span>
              <p className="font-semibold text-slate-200 mt-0.5">{task.category}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] text-slate-500">Orchestration Mode</span>
              <p className="font-semibold text-slate-200 mt-0.5">{task.orchestration_mode.replace('_', ' ')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] text-slate-500">Duration</span>
              <p className="font-semibold text-cyan-400 font-mono mt-0.5">
                {task.duration_seconds > 0 ? `${task.duration_seconds}s` : 'In Progress...'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] text-slate-500">Memory References</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {task.memory_references?.length || 0} retrieved
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retrieved Memory References Drawer */}
      {task && task.memory_references && task.memory_references.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#091122] border border-cyan-500/15 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Retrieved Qdrant Vector Memories ({task.memory_references.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {task.memory_references.map((mem, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-medium text-cyan-400">[{mem.topic || 'General'}]</span>
                  <span className="font-mono text-[10px]">Relevance: {mem.score ?? 'N/A'}</span>
                </div>
                <p className="text-slate-300 line-clamp-2">{mem.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Workflow Execution Stream */}
      <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Execution Telemetry Timeline</h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
            <span>SSE Stream Active</span>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((ev, index) => {
            const isExpanded = !!expandedEvents[ev.id];
            const hasPayload = ev.payload && Object.keys(ev.payload).length > 0;
            const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '';

            return (
              <div
                key={ev.id || index}
                className="p-3.5 rounded-xl bg-[#080e1c] border border-slate-800 hover:border-cyan-500/25 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        ev.status === 'running'
                          ? 'bg-cyan-400 animate-ping'
                          : ev.status === 'completed'
                          ? 'bg-emerald-400'
                          : ev.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <span className="font-bold text-slate-200 mr-2">{ev.agent_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                        {ev.event_type}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                </div>

                <p className="text-slate-300 mt-2 pl-4 border-l border-slate-800 leading-relaxed">
                  {ev.message}
                </p>

                {hasPayload && (
                  <div className="mt-2.5 pl-4">
                    <button
                      onClick={() => toggleEventExpand(ev.id)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isExpanded ? 'Hide Payload' : 'View Payload Data'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Consolidated Result */}
      {task && task.final_result && (
        <div className="p-6 rounded-2xl bg-[#0b1324] border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100">Final Swarm Synthesis Report</h2>
            </div>

            <button
              onClick={copyResult}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#070c17] border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {task.final_result}
          </div>
        </div>
      )}
    </div>
  );
};
