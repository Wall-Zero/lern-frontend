import apiClient from '../client';
import type { AITool, AIToolListResponse, AnalyzeRequest, ConfigureRequest } from '../../types/aitools.types';

export const aitoolsApi = {
  list: async (): Promise<AIToolListResponse> => {
    const response = await apiClient.get('/ai-tools/');
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
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ai-tools/${id}/`);
  },
};