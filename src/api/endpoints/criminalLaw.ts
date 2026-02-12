// src/api/endpoints/criminalLaw.ts

import apiClient from '../client';
import type {
  Article,
  ArticleDetail,
  PaginatedResponse,
  SearchFilters,
  SemanticSearchRequest,
  SearchResult,
  Statistics,
} from '../../types/criminalLaw.types';

export const criminalLawApi = {
  // List articles with pagination
  getArticles: async (params: SearchFilters = {}): Promise<PaginatedResponse<Article>> => {
    const { data } = await apiClient.get('/criminal-law/', { params });
    return data;
  },

  // Get article detail
  getArticle: async (id: number): Promise<ArticleDetail> => {
    const { data } = await apiClient.get(`/criminal-law/${id}/`);
    return data;
  },

  // Text search
  searchText: async (
    query: string,
    filters: SearchFilters = {}
  ): Promise<{ query: string; count: number; page: number; page_size: number; total_pages: number; results: SearchResult[] }> => {
    const { data } = await apiClient.get('/criminal-law/search/text/', {
      params: { q: query, ...filters },
    });
    return data;
  },

  // Semantic search
  searchSemantic: async (
    body: SemanticSearchRequest
  ): Promise<{
    query: string;
    total_results: number;
    query_time_ms: number;
    similarity_threshold: number;
    results: SearchResult[];
  }> => {
    const { data } = await apiClient.post('/criminal-law/search/semantic/', body);
    return data;
  },

  // Get statistics
  getStats: async (): Promise<Statistics> => {
    const { data } = await apiClient.get('/criminal-law/stats/');
    return data;
  },

  // Get volumes list
  getVolumes: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/criminal-law/volumes/');
    return data.volumes;
  },
};