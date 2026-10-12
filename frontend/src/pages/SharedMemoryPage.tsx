import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Plus, Trash2, RefreshCw, 
  Tag, Clock, AlertTriangle, Layers, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { MemoryRecord, MemoryStats } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';

export const SharedMemoryPage: React.FC = () => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // New Memory Form
  const [newMemory, setNewMemory] = useState({
    text: '',
    topic: 'Architecture',
    source: 'manual_entry',
  });

  const loadStatsAndMemories = async () => {
    try {
      setLoading(true);
      const statsData = await api.getMemoryStats();
      setStats(statsData);

      // Perform default vector search to pull recent items
      const results = await api.searchMemory(searchQuery || 'NEXUS multi-agent system', {
        limit: 25,
      });
      setMemories(results);
    } catch (e) {
      console.error('Failed to load Qdrant memory', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndMemories();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const results = await api.searchMemory(searchQuery.trim(), {
        limit: 25,
        topic: selectedTopic !== 'All' ? selectedTopic : undefined,
      });
      setMemories(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stored = await api.storeMemory(newMemory);
      setMemories((prev) => [stored, ...prev]);
      setAddModalOpen(false);
      setNewMemory({ text: '', topic: 'Architecture', source: 'manual_entry' });
      const updatedStats = await api.getMemoryStats();
      setStats(updatedStats);
    } catch (e) {
      console.error(e);
      alert('Failed to store vector memory point');
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this vector memory point from Qdrant?')) return;
    try {
      await api.deleteMemory(memoryId);
      setMemories((prev) => prev.filter((m) => m.memory_id !== memoryId));
      const updatedStats = await api.getMemoryStats();
      setStats(updatedStats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCollection = async () => {
    try {
      await api.clearMemories();
      setMemories([]);
      setClearModalOpen(false);
      const updatedStats = await api.getMemoryStats();
      setStats(updatedStats);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (selectedTopic === 'All') return true;
    return m.topic === selectedTopic;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">Qdrant Shared Vector Memory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time semantic retrieval engine powering long-term context retention across the multi-agent mesh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStatsAndMemories}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
            title="Refresh Memory Index"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory Point</span>
          </button>
        </div>
      </div>

      {/* Cluster Stats Banner */}
      {stats && (
        <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${stats.is_connected ? 'bg-emerald-400 glow-cyan' : 'bg-red-400'}`} />
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Collection: {stats.collection_name}
                </span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                  {stats.is_connected ? 'Live Cluster Operational' : 'Cluster Disconnected'}
                </span>
              </div>
            </div>

            {stats.is_connected && (
              <button
                onClick={() => setClearModalOpen(true)}
                className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Memory</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 text-[10px]">Total Vector Points</span>
              <p className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{stats.total_vectors_count}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 text-[10px]">Vector Dimensions</span>
              <p className="text-lg font-bold text-slate-200 font-mono mt-0.5">{stats.vector_dimension}D</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 text-[10px]">Distance Metric</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">{stats.distance_metric}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 text-[10px]">Cluster Status</span>
              <p className="text-lg font-bold text-emerald-400 capitalize mt-0.5">{stats.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Search & Filters */}
      <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vector memory by semantic meaning (e.g. 'consensus latency tradeoffs')..."
              className="w-full bg-[#080d19] border border-cyan-500/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            Vector Search
          </button>
        </form>

        {/* Topic Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Topics:</span>
          {['All', 'Architecture', 'Research', 'Planning', 'General', 'Voice'].map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedTopic === topic
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Points List */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs p-8 rounded-2xl bg-[#0b1324] border border-slate-800">
            No vector memories match the query. Add a new memory point or run a task with "Persist to Memory" enabled.
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const timeStr = mem.created_at ? new Date(mem.created_at).toLocaleDateString() : 'Active';
            return (
              <div
                key={mem.memory_id}
                className="p-4 rounded-xl bg-[#0b1324] border border-slate-800 hover:border-cyan-500/25 transition-all text-xs flex flex-col md:flex-row md:items-start justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-semibold text-[10px]">
                      {mem.topic}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Source: {mem.source}
                    </span>
                    {mem.score !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-mono">
                        Similarity: {(mem.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans">{mem.text}</p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span>ID: {mem.memory_id.slice(0, 12)}...</span>
                    <span>Date: {timeStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-start">
                  <button
                    onClick={() => handleDeleteMemory(mem.memory_id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Vector Point"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Manual Memory */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Memory Point to Qdrant"
      >
        <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Knowledge Content / Text</label>
            <textarea
              required
              rows={4}
              value={newMemory.text}
              onChange={(e) => setNewMemory({ ...newMemory, text: e.target.value })}
              placeholder="Enter architectural facts, technical standards, or project context..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Topic Classification</label>
              <select
                value={newMemory.topic}
                onChange={(e) => setNewMemory({ ...newMemory, topic: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Architecture">Architecture</option>
                <option value="Research">Research</option>
                <option value="Planning">Planning</option>
                <option value="Security">Security</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Source Tag</label>
              <input
                type="text"
                value={newMemory.source}
                onChange={(e) => setNewMemory({ ...newMemory, source: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20"
            >
              Embed & Upsert Point
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Clear Collection */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Confirm Collection Wipe"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-sm">Destructive Action</p>
              <p className="text-[11px] text-red-300 mt-0.5">
                This will delete all indexed vector points inside the <span className="font-mono">nexus_memory</span> collection in Qdrant Cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setClearModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleClearCollection}
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
            >
              Permanently Clear Collection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
