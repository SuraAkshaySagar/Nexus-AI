import { 
  Task, TaskCreate, Agent, MemoryRecord, MemoryStats, 
  VoiceConversation, IntegrationsStatus, AnalyticsOverview 
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      // fallback to status text
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Tasks
  async getTasks(params?: { status?: string; category?: string; search?: string }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return fetchJson<Task[]>(`${API_BASE}/tasks?${query.toString()}`);
  },

  async getTask(taskId: string): Promise<Task> {
    return fetchJson<Task>(`${API_BASE}/tasks/${taskId}`);
  },

  async createTask(data: TaskCreate): Promise<Task> {
    return fetchJson<Task>(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async retryTask(taskId: string): Promise<Task> {
    return fetchJson<Task>(`${API_BASE}/tasks/${taskId}/retry`, {
      method: 'POST',
    });
  },

  async deleteTask(taskId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Agents
  async getAgents(): Promise<Agent[]> {
    return fetchJson<Agent[]>(`${API_BASE}/agents`);
  },

  async registerAgent(data: { name: string; role: string; description: string; lyzr_agent_id: string; is_manager?: boolean }): Promise<Agent> {
    return fetchJson<Agent>(`${API_BASE}/agents/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAgent(agentId: string, data: Partial<Agent>): Promise<Agent> {
    return fetchJson<Agent>(`${API_BASE}/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async testAgent(agentId: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/agents/${agentId}/test`, {
      method: 'POST',
    });
  },

  // Memory
  async searchMemory(query: string, options?: { limit?: number; topic?: string; source?: string }): Promise<MemoryRecord[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (options?.limit) searchParams.append('limit', options.limit.toString());
    if (options?.topic) searchParams.append('topic', options.topic);
    if (options?.source) searchParams.append('source', options.source);
    return fetchJson<MemoryRecord[]>(`${API_BASE}/memory/search?${searchParams.toString()}`);
  },

  async storeMemory(data: { text: string; topic?: string; source?: string; metadata?: Record<string, any> }): Promise<MemoryRecord> {
    return fetchJson<MemoryRecord>(`${API_BASE}/memory`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteMemory(memoryId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/memory/${memoryId}`, {
      method: 'DELETE',
    });
  },

  async clearMemories(): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/memory`, {
      method: 'DELETE',
    });
  },

  async getMemoryStats(): Promise<MemoryStats> {
    return fetchJson<MemoryStats>(`${API_BASE}/memory/stats`);
  },

  // Voice / Omi
  async getVoiceConversations(): Promise<VoiceConversation[]> {
    return fetchJson<VoiceConversation[]>(`${API_BASE}/voice/conversations`);
  },

  async executeVoiceConversation(conversationId: string, category: string = 'General'): Promise<{ task_id: string; task: Task }> {
    return fetchJson<{ task_id: string; task: Task }>(`${API_BASE}/voice/conversations/${conversationId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ category, priority: 'normal', save_to_memory: true }),
    });
  },

  // Integrations & Health
  async getIntegrationsStatus(): Promise<IntegrationsStatus> {
    return fetchJson<IntegrationsStatus>(`${API_BASE}/integrations/status`);
  },

  async testIntegration(service: 'qdrant' | 'lyzr' | 'omi'): Promise<any> {
    return fetchJson<any>(`${API_BASE}/integrations/test/${service}`, {
      method: 'POST',
    });
  },

  async getHealth(): Promise<any> {
    return fetchJson<any>(`${API_BASE}/health`);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsOverview> {
    return fetchJson<AnalyticsOverview>(`${API_BASE}/analytics/overview`);
  },
};
