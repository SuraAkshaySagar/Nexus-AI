export type TaskStatus = 
  | 'pending' 
  | 'retrieving_memory' 
  | 'planning' 
  | 'executing' 
  | 'reviewing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type TaskCategory = 
  | 'Research' 
  | 'Architecture' 
  | 'Planning' 
  | 'Analysis' 
  | 'General';

export type OrchestrationMode = 
  | 'manager_guided' 
  | 'autonomous' 
  | 'hierarchical';

export type TaskPriority = 'normal' | 'high' | 'critical';

export interface TaskCreate {
  title?: string;
  prompt: string;
  category?: TaskCategory;
  orchestration_mode?: OrchestrationMode;
  priority?: TaskPriority;
  source?: 'dashboard' | 'omi_voice' | 'api';
  user_id?: string;
  context?: string;
  save_to_memory?: boolean;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  agent_name: string;
  event_type: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  message: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface TaskMemoryRef {
  memory_id: string;
  text: string;
  topic: string;
  source: string;
  score?: number;
  task_id?: string;
}

export interface Task {
  id: string;
  title: string;
  prompt: string;
  category: TaskCategory;
  orchestration_mode: OrchestrationMode;
  priority: TaskPriority;
  source: 'dashboard' | 'omi_voice' | 'api';
  status: TaskStatus;
  assigned_agents: string[];
  memory_references: TaskMemoryRef[];
  final_result: string;
  error_message: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  events?: TaskEvent[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  lyzr_agent_id: string;
  is_manager: boolean;
  enabled: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_response_time_ms: number;
  created_at: string;
}

export interface MemoryRecord {
  memory_id: string;
  text: string;
  topic: string;
  source: string;
  task_id?: string;
  user_id?: string;
  created_at: string;
  metadata: Record<string, any>;
  score?: number;
}

export interface MemoryStats {
  collection_name: string;
  status: string;
  total_vectors_count: number;
  indexed_vectors_count: number;
  vector_dimension: number;
  distance_metric: string;
  is_connected: boolean;
  error?: string | null;
}

export interface VoiceConversation {
  id: string;
  title: string;
  source: string;
  transcript: string;
  speakers: string[];
  action_items: string[];
  extracted_tasks: string[];
  associated_task_id?: string;
  created_at: string;
}

export interface ServiceStatus {
  name: string;
  status: 'connected' | 'not_configured' | 'failed' | 'degraded' | 'checking';
  is_configured: boolean;
  endpoint?: string;
  latency_ms?: number;
  message: string;
  details?: Record<string, any>;
}

export interface IntegrationsStatus {
  backend: ServiceStatus;
  lyzr: ServiceStatus;
  qdrant: ServiceStatus;
  omi: ServiceStatus;
}

export interface AnalyticsOverview {
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  avg_duration: number;
  success_rate: number;
  category_distribution: { name: string; value: number }[];
  daily_trends: { date: string; tasks: number; completed: number }[];
  agents_metrics?: Agent[];
}
