import apiClient from '../client';
import type { Dataset, DatasetListResponse, CreateDatasetRequest } from '../../types/dataset.types';

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
};