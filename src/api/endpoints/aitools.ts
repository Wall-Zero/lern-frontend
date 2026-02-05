import apiClient from '../client';
import type { AITool, AIToolListResponse, AnalyzeRequest, ConfigureRequest } from '../../types/aitools.types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string, provider: string) => void;
  onError: (error: string, partialText: string) => void;
}

export function generateStream(
  data: { prompt: string; provider: string; max_tokens?: number },
  callbacks: StreamCallbacks,
): AbortController {
  const controller = new AbortController();
  const token = localStorage.getItem('access_token');

  fetch(`${API_BASE_URL}/ai-tools/generate_stream/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        callbacks.onError(`HTTP ${response.status}: ${text}`, '');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No response body', '');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const payload = JSON.parse(trimmed.slice(6));

            if (payload.error) {
              callbacks.onError(payload.error, payload.partial_text || '');
              return;
            }

            if (payload.done) {
              callbacks.onDone(payload.full_text || '', payload.provider || '');
              return;
            }

            if (payload.token !== undefined) {
              callbacks.onToken(payload.token);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      callbacks.onError(err.message || 'Stream failed', '');
    });

  return controller;
}

export async function motionIntake(data: {
  conversation: Array<{ role: string; content: string }>;
  motion_type?: string;
  provider?: string;
}) {
  const response = await apiClient.post('/ai-tools/motion_intake/', data);
  return response.data;
}

export const aitoolsApi = {
  list: async (params?: { status?: string }): Promise<AIToolListResponse> => {
    const response = await apiClient.get('/ai-tools/', { params });
    return response.data;
  },

  get: async (id: number): Promise<AITool> => {
    const response = await apiClient.get(`/ai-tools/${id}/`);
    return response.data;
  },

  analyze: async (data: AnalyzeRequest): Promise<AITool> => {
    const response = await apiClient.post('/ai-tools/analyze/', data);
    return response.data;
  },

  configure: async (id: number, data: ConfigureRequest): Promise<AITool> => {
    const response = await apiClient.post(`/ai-tools/${id}/configure/`, data);
    return response.data;
  },

  generateCode: async (id: number): Promise<AITool> => {
    const response = await apiClient.post(`/ai-tools/${id}/generate_code/`);
    return response.data;
  },
  
  train: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/ai-tools/${id}/train/`);
    return response.data;
  },
  trainDirect: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/ai-tools/${id}/train_direct/`);
    return response.data;
  },
  predict: async (id: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/ai-tools/${id}/predict/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  setActiveVersion: async (id: number, versionId: number): Promise<any> => {
    const response = await apiClient.post(`/ai-tools/${id}/set_active_version/`, { version_id: versionId });
    return response.data;
  },
  generate: async (data: { prompt: string; provider: string; max_tokens?: number }) => {
    const response = await apiClient.post('/ai-tools/generate/', data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ai-tools/${id}/`);
  },
};