import apiClient from '../client';

export interface PredictionResult {
  sample_index: number;
  input: Record<string, any>;
  prediction: number;
  target_column: string;
}

export interface PredictionResponse {
  success: boolean;
  predictions?: PredictionResult[];
  error?: string;
}

export const predictionsApi = {
  // Hacer predicción
  predict: async (modelId: number, file: File): Promise<PredictionResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/ai-tools/${modelId}/predict/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Historial de predicciones (preparado para futuro)
  getHistory: async () => {
    // TODO: Implementar cuando el backend esté listo
    // return await apiClient.get('/api/predictions/history/');
    return { results: [] };
  },

  // Descargar resultado específico (preparado para futuro)
  downloadResult: async (predictionId: number) => {
    // TODO: Implementar cuando el backend esté listo
    // return await apiClient.get(`/api/predictions/${predictionId}/download/`);
    return null;
  },
};