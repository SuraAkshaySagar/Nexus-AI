import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Sparkles, Copy, Check, ArrowRight, 
  ExternalLink, ListChecks, Users, Clock, PlayCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { VoiceConversation } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

export const VoiceIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<VoiceConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const webhookUrl = `${window.location.origin}/api/v1/integrations/omi/conversation`;

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getVoiceConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to load voice notes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleExecute = async (conv: VoiceConversation) => {
    try {
      setExecutingId(conv.id);
      const res = await api.executeVoiceConversation(conv.id, 'General');
      navigate(`/execution?taskId=${res.task_id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to trigger voice task');
    } finally {
      setExecutingId(null);
    }
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">Omi Voice Intelligence Hub</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Real-time voice capture ingestion from your Omi wearable or mobile app. Automated action item extraction and 1-click multi-agent orchestration.
        </p>
      </div>

      {/* Webhook Configuration Instructions Card */}
      <div className="p-5 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 glow-violet" />
            <span>Omi Webhook Setup Instructions</span>
          </h2>
          <span className="text-[11px] text-slate-400">Webhook Token Authentication</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Configure your Omi app or ngrok tunnel to route transcribed conversation memories to this NEXUS endpoint. Transcripts are parsed defensively, speakers identified, and action items extracted for autonomous swarm execution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500">Webhook Endpoint URL:</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200 truncate">{webhookUrl}</span>
              <button
                onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                className="p-1 rounded text-slate-400 hover:text-cyan-400"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500">Header: x-omi-secret</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200">nexus_omi_webhook_secret_key</span>
              <button
                onClick={() => copyToClipboard('nexus_omi_webhook_secret_key', setCopiedSecret)}
                className="p-1 rounded text-slate-400 hover:text-cyan-400"
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
          <span>Captured Voice Transcripts ({conversations.length})</span>
          <button
            onClick={loadConversations}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Refresh
          </button>
        </h2>

        {conversations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs p-8 rounded-2xl bg-[#0b1324] border border-slate-800">
            No voice conversations captured yet. Send an Omi webhook payload or check the sample memo.
          </div>
        ) : (
          conversations.map((conv) => {
            const isExecuting = executingId === conv.id;
            return (
              <div
                key={conv.id}
                className="p-5 rounded-2xl bg-[#0b1324] border border-slate-800 hover:border-violet-500/30 transition-all text-xs space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm">{conv.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(conv.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {conv.associated_task_id ? (
                      <button
                        onClick={() => navigate(`/execution?taskId=${conv.associated_task_id}`)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Task Generated</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExecute(conv)}
                        disabled={isExecuting}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isExecuting ? 'Dispatching...' : 'Execute with Multi-Agent Swarm'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Speakers Badges */}
                {conv.speakers && conv.speakers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Speakers:</span>
                    </span>
                    {conv.speakers.map((sp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Full Transcript Block */}
                <div className="p-3.5 rounded-xl bg-[#070c17] border border-slate-800 text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {conv.transcript}
                </div>

                {/* Extracted Tasks & Action Items */}
                {conv.action_items && conv.action_items.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-violet-300 text-[11px]">
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Extracted Action Items ({conv.action_items.length})</span>
                    </div>
                    <ul className="space-y-1 list-disc list-inside text-slate-300 text-[11px]">
                      {conv.action_items.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
