import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Play, Pause, Layers } from 'lucide-react';
import { Agent } from '../../types';

interface AgentNodeProps {
  agent: Agent;
  position: [number, number, number];
  isManager?: boolean;
  onSelect: (agent: Agent) => void;
  isRunning?: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({
  agent,
  position,
  isManager = false,
  onSelect,
  isRunning = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Dynamic colors based on status and agent type
  const baseColor = useMemo(() => {
    if (isManager) return '#36D9FF';
    if (agent.role.includes('Research')) return '#38BDF8';
    if (agent.role.includes('Technical') || agent.role.includes('Architect')) return '#9B7CFF';
    if (agent.role.includes('Planning')) return '#F59E0B';
    if (agent.role.includes('Review')) return '#10B981';
    return '#60A5FA';
  }, [isManager, agent.role]);

  const activeColor = useMemo(() => {
    if (agent.status === 'running') return '#36D9FF';
    if (agent.status === 'completed') return '#10B981';
    if (agent.status === 'failed') return '#EF4444';
    return baseColor;
  }, [agent.status, baseColor]);

  // Node rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isManager ? 0.8 : 0.4);
      meshRef.current.rotation.x += delta * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isRunning ? 2.0 : 0.5);
    }
  });

  const nodeRadius = isManager ? 0.6 : 0.42;

  return (
    <group position={position}>
      {/* Outer Rotating Gyro Ring for Manager or Active Agent */}
      {(isManager || isRunning) && (
        <mesh ref={ringRef}>
          <ringGeometry args={[nodeRadius * 1.5, nodeRadius * 1.6, 32]} />
          <meshBasicMaterial
            color={activeColor}
            side={THREE.DoubleSide}
            transparent
            opacity={isRunning ? 0.75 : 0.35}
          />
        </mesh>
      )}

      {/* Interactive Main Core Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(agent);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[nodeRadius, 32, 32]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={hovered || isRunning ? 0.8 : 0.3}
          metalness={0.7}
          roughness={0.2}
          wireframe={isManager}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh>
        <sphereGeometry args={[nodeRadius * 0.55, 16, 16]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* HTML Label Floating Above Node */}
      <Html position={[0, nodeRadius + 0.35, 0]} center distanceFactor={8}>
        <div
          onClick={() => onSelect(agent)}
          className={`pointer-events-auto cursor-pointer whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border transition-all ${
            hovered || isRunning
              ? 'bg-slate-900/90 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
              : 'bg-slate-900/70 text-slate-300 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                agent.status === 'running'
                  ? 'bg-cyan-400 animate-ping'
                  : agent.status === 'completed'
                  ? 'bg-emerald-400'
                  : agent.status === 'failed'
                  ? 'bg-red-400'
                  : 'bg-slate-400'
              }`}
            />
            <span>{isManager ? 'Manager' : agent.role.replace(' Agent', '')}</span>
          </div>
        </div>
      </Html>
    </group>
  );
};

// Animated Pulse traveling between manager and specialist
interface PulseLineProps {
  start: [number, number, number];
  end: [number, number, number];
  active?: boolean;
}

const PulseConnection: React.FC<PulseLineProps> = ({ start, end, active = false }) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  const startV = useMemo(() => new THREE.Vector3(...start), [start]);
  const endV = useMemo(() => new THREE.Vector3(...end), [end]);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = (clock.getElapsedTime() * (active ? 1.5 : 0.6)) % 1;
      pulseRef.current.position.lerpVectors(startV, endV, t);
    }
  });

  return (
    <group>
      {/* Static connecting line */}
      <Line
        points={[start, end]}
        color={active ? '#36D9FF' : '#1e293b'}
        transparent
        opacity={active ? 0.7 : 0.3}
        lineWidth={active ? 1.5 : 1}
      />

      {/* Traveling energy pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial
          color={active ? '#36D9FF' : '#9B7CFF'}
          transparent
          opacity={active ? 0.9 : 0.5}
        />
      </mesh>
    </group>
  );
};

// Subtle Star / Particle Field
const ParticlesField: React.FC = () => {
  const points = useMemo(() => {
    const coords = [];
    for (let i = 0; i < 160; i++) {
      coords.push(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }
    return new Float32Array(coords);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#36D9FF"
        transparent
        opacity={0.35}
      />
    </points>
  );
};

interface AgentNetwork3DProps {
  agents: Agent[];
  activeTaskId?: string | null;
  onSelectAgent: (agent: Agent) => void;
  onToggle2D?: () => void;
}

export const AgentNetwork3D: React.FC<AgentNetwork3DProps> = ({
  agents,
  onSelectAgent,
  onToggle2D,
}) => {
  const controlsRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const manager = agents.find((a) => a.is_manager) || agents[0];
  const specialists = agents.filter((a) => !a.is_manager);

  // Distribute specialists symmetrically around central manager in 3D
  const specialistPositions: [number, number, number][] = useMemo(() => {
    const radius = 3.2;
    return specialists.map((_, index) => {
      const angle = (index * (2 * Math.PI)) / Math.max(specialists.length, 1);
      const yOffset = Math.sin(index * 1.5) * 0.8;
      const zOffset = Math.cos(index * 2) * 0.9;
      return [
        radius * Math.cos(angle),
        yOffset,
        radius * Math.sin(angle) + zOffset,
      ];
    });
  }, [specialists]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[440px] bg-[#070b14] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.2, 7.2], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.65} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#36D9FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#9B7CFF" />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minDistance={3.5}
          maxDistance={14}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />

        <ParticlesField />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          {/* Central Manager Agent */}
          {manager && (
            <AgentNode
              agent={manager}
              position={[0, 0, 0]}
              isManager={true}
              onSelect={onSelectAgent}
              isRunning={manager.status === 'running'}
            />
          )}

          {/* Specialist Agents & Connection Lines */}
          {specialists.map((agent, i) => {
            const pos = specialistPositions[i] || [0, 0, 0];
            const isConnActive = agent.status === 'running' || (manager && manager.status === 'running');
            return (
              <React.Fragment key={agent.id}>
                <PulseConnection
                  start={[0, 0, 0]}
                  end={pos}
                  active={isConnActive}
                />
                <AgentNode
                  agent={agent}
                  position={pos}
                  isManager={false}
                  onSelect={onSelectAgent}
                  isRunning={agent.status === 'running'}
                />
              </React.Fragment>
            );
          })}
        </Float>
      </Canvas>

      {/* Floating Interactive Controls HUD */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#0d1527]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/20 text-xs">
        <span className="w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
        <span className="text-slate-200 font-medium">3D Multi-Agent Topology</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#0d1527]/85 backdrop-blur-md p-1 rounded-xl border border-cyan-500/20">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            autoRotate ? 'text-cyan-400 bg-cyan-500/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Camera Angle"
          className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {onToggle2D && (
          <button
            onClick={onToggle2D}
            title="Switch to 2D Fallback View"
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px]">2D</span>
          </button>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 text-[11px] text-slate-400 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800 pointer-events-none">
        Click node for agent telemetry • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};
