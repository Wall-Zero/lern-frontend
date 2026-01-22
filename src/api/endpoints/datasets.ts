import apiClient from '../client';
import type { Dataset, DatasetListResponse, CreateDatasetRequest, DataInsightsRequest, DataInsightsResponse } from '../../types/dataset.types';

export interface DatasetPreview {
  columns: string[];
  data: Record<string, any>[];
  total_rows: number;
}

export const datasetsApi = {
  list: async (): Promise<DatasetListResponse> => {
    const response = await apiClient.get('/data-sources/');
    return response.data;
  },

  get: async (id: number): Promise<Dataset> => {
    const response = await apiClient.get(`/data-sources/${id}/`);
    return response.data;
  },

  getColumns: async (id: number) => {
    const response = await apiClient.get(`/data-sources/${id}/columns/`);
    return response.data;
  },

  preview: async (id: number, rows: number = 100): Promise<DatasetPreview> => {
    const response = await apiClient.get(`/data-sources/${id}/preview/`, {
      params: { rows }
    });
    return response.data;
  },

  create: async (data: CreateDatasetRequest): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('file', data.file);

    const response = await apiClient.post('/data-sources/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/data-sources/${id}/`);
  },

  getInsights: async (request: DataInsightsRequest): Promise<DataInsightsResponse> => {
    const response = await apiClient.post('/ai-tools/data_insights/', request);
    return response.data;
  },
};