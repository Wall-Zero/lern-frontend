import apiClient from '../client';
import type { QuickTrainConfig, MergeFredConfig, FredBrowseResponse } from '../../types/workspace.types';

export const workspaceApi = {
  quickTrain: async (id: number, config: QuickTrainConfig) => {
    const response = await apiClient.post(`/ai-tools/${id}/quick_train/`, config);
    return response.data;
  },

  browseFred: async (params: { search: string; limit?: number }): Promise<FredBrowseResponse> => {
    const response = await apiClient.get('/data-sources/fred_browse/', { params });
    return response.data;
  },

  mergeFred: async (dataSourceId: number, config: MergeFredConfig) => {
    const response = await apiClient.post(`/data-sources/${dataSourceId}/merge_fred/`, config);
    return response.data;
  },

  getPreview: async (dataSourceId: number, rows: number = 50) => {
    const response = await apiClient.get(`/data-sources/${dataSourceId}/preview/`, { params: { rows } });
    return response.data;
  },

  getMetadata: async (dataSourceId: number) => {
    const response = await apiClient.get(`/data-sources/${dataSourceId}/metadata/`);
    return response.data;
  },

  dataInsights: async (data: { data_source_id?: number; data_source_ids?: number[]; intent?: string; providers?: string[] }) => {
    const response = await apiClient.post('/ai-tools/data_insights/', data);
    return response.data;
  },

  analyze: async (data: { name: string; intent: string; data_source_id: number; ai_model: string }) => {
    const response = await apiClient.post('/ai-tools/analyze/', data);
    return response.data;
  },

  predict: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/ai-tools/${id}/predict/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
