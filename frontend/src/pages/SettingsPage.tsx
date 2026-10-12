import React, { useState, useEffect } from 'react';
import { Settings, Eye, Sliders, Shield, Database, Terminal, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [autoRotate, setAutoRotate] = useState(() => {
    return localStorage.getItem('nexus_auto_rotate') !== 'false';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('nexus_reduced_motion') === 'true';
  });
  const [streamMode, setStreamMode] = useState<'sse' | 'polling'>('sse');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('nexus_auto_rotate', String(autoRotate));
    localStorage.setItem('nexus_reduced_motion', String(reducedMotion));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">System & Display Settings</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure rendering performance, 3D visualization behavior, and orchestration parameters.
        </p>
      </div>

      {/* 3D Visual Rendering Settings */}
      <div className="p-6 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>3D Mesh & Graphics Performance</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
            <div>
              <p className="font-medium text-slate-200">Continuous Topology Rotation</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically rotate the 3D agent network when no interaction is detected.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
            <div>
              <p className="font-medium text-slate-200">Reduced Motion Mode</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Diminish particle density and high-frequency camera oscillations.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
          </label>
        </div>
      </div>

      {/* Real-time Streaming Mode */}
      <div className="p-6 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Telemetry Transport Protocols</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div
            onClick={() => setStreamMode('sse')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              streamMode === 'sse'
                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <p className="font-semibold text-sm">Server-Sent Events (SSE)</p>
            <p className="text-[11px] mt-1 text-slate-400">
              Low-latency HTTP/2 event streaming from `/api/v1/tasks/{'{id}'}/events`. Recommended for live execution monitoring.
            </p>
          </div>

          <div
            onClick={() => setStreamMode('polling')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              streamMode === 'polling'
                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <p className="font-semibold text-sm">Polling Fallback</p>
            <p className="text-[11px] mt-1 text-slate-400">
              Periodic 2-second GET polling intervals for environments with restricted long-lived connections.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Specification Reference */}
      <div className="p-6 rounded-2xl bg-[#0b1324] border border-cyan-500/20 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>Server Environment Configuration (`backend/.env`)</span>
        </h2>

        <div className="p-4 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`LYZR_API_KEY=your_lyzr_api_key
LYZR_AGENT_ID=nexus-manager
QDRANT_URL=https://d99af7c1-3fa8-40d0-84c3-8212924e8fe6.eu-west-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOi...
QDRANT_COLLECTION=nexus_memory
OMI_WEBHOOK_SECRET=nexus_omi_webhook_secret_key
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite:///./nexus_data.db`}</pre>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          {saved && <Check className="w-4 h-4" />}
          <span>{saved ? 'Settings Saved' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};
