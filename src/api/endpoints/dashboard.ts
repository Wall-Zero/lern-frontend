import api from '../client';

export interface DashboardStats {
  total_datasets: number;
  active_analysis: number;
  trained_models: number;
  total_predictions: number;
}

export interface RecentAnalysis {
  id: number;
  name: string;
  status: 'configuring' | 'training' | 'trained' | 'analyzing';
  data_source_name: string;
  created_at: string;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    // Mock por ahora - reemplazar cuando backend tenga endpoint
    const response = await api.get('/dashboards/stats/');
    if (response.data) {
      return response.data;
    }
    return {
      total_datasets: 0,
      active_analysis: 0,
      trained_models: 0,
      total_predictions: 0,
    };
  },

  async getRecentAnalysis(): Promise<RecentAnalysis[]> {
    const response = await api.get('/ai-tools/', {
      params: { limit: 3, ordering: '-created_at' },
    });
    return response.data.results;
  },
};