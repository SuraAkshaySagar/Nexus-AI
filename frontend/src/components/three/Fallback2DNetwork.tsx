import React from 'react';
import { Agent } from '../../types';

interface Fallback2DNetworkProps {
  agents: Agent[];
  activeTaskId?: string | null;
  onSelectAgent: (agent: Agent) => void;
}

export const Fallback2DNetwork: React.FC<Fallback2DNetworkProps> = ({
  agents,
  onSelectAgent,
}) => {
  const manager = agents.find((a) => a.is_manager) || agents[0];
  const specialists = agents.filter((a) => !a.is_manager);

  // Radial positions for 2D diagram
  const getCoordinates = (index: number, total: number, radius = 160) => {
    const angle = (index * (2 * Math.PI)) / total - Math.PI / 2;
    return {
      x: 250 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#36D9FF';
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'waiting': return '#F59E0B';
      default: return '#64748B';
    }
  };

  return (
    <div className="relative w-full h-[380px] bg-[#090e1a] rounded-2xl border border-cyan-500/15 overflow-hidden flex items-center justify-center">
      <svg className="w-full h-full max-w-[500px]" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="cyanLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#36D9FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9B7CFF" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle cx="250" cy="200" r="160" fill="none" stroke="rgba(54, 217, 255, 0.1)" strokeDasharray="4 4" />
        <circle cx="250" cy="200" r="80" fill="none" stroke="rgba(155, 124, 255, 0.12)" />

        {/* Lines from Manager to Specialists */}
        {specialists.map((agent, i) => {
          const coords = getCoordinates(i, specialists.length);
          const isRunning = agent.status === 'running';
          return (
            <g key={`line-${agent.id}`}>
              <line
                x1="250"
                y1="200"
                x2={coords.x}
                y2={coords.y}
                stroke={isRunning ? '#36D9FF' : 'rgba(54, 217, 255, 0.25)'}
                strokeWidth={isRunning ? '2.5' : '1.5'}
                strokeDasharray={isRunning ? '5 5' : 'none'}
                className={isRunning ? 'animate-pulse' : ''}
              />
            </g>
          );
        })}

        {/* Manager Center Node */}
        {manager && (
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => onSelectAgent(manager)}
            transform="translate(250, 200)"
          >
            <circle r="36" fill="rgba(54, 217, 255, 0.15)" stroke="#36D9FF" strokeWidth="2" filter="url(#glow)" />
            <circle r="24" fill="#101827" stroke="#36D9FF" strokeWidth="1.5" />
            <circle r="8" fill="#36D9FF" />
            <text y="48" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
              Manager
            </text>
            <text y="60" textAnchor="middle" fill="#36D9FF" fontSize="9">
              {manager.status.toUpperCase()}
            </text>
          </g>
        )}

        {/* Specialist Nodes */}
        {specialists.map((agent, i) => {
          const coords = getCoordinates(i, specialists.length);
          const color = getStatusColor(agent.status);
          const isRunning = agent.status === 'running';

          return (
            <g
              key={agent.id}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelectAgent(agent)}
              transform={`translate(${coords.x}, ${coords.y})`}
            >
              <circle
                r="24"
                fill="rgba(16, 24, 39, 0.85)"
                stroke={color}
                strokeWidth="1.5"
                filter={isRunning ? 'url(#glow)' : undefined}
              />
              <circle r="6" fill={color} />
              <text y="36" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="500">
                {agent.role.replace(' Agent', '')}
              </text>
              <text y="48" textAnchor="middle" fill={color} fontSize="8">
                {agent.status}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 right-3 text-[11px] text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
        2D Topology View
      </div>
    </div>
  );
};
