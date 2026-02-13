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

  // ========================================
  // RAG Endpoints
  // ========================================

  /**
   * Non-streaming RAG query
   * Use this for simple requests that don't need real-time streaming
   */
  askRAG: async (
    query: string,
    options?: {
      alpha?: number;
      limit?: number;
      use_reranker?: boolean;
    }
  ): Promise<{
    answer: string;
    sources: Array<{
      id: number;
      title: string;
      url: string;
      relevance: number;
      rerank_score?: number;
    }>;
    definitions: Array<{
      term: string;
      definition: string;
    }>;
    controlling_sections: string[];
    case_citations: Array<{
      name: string;
      url: string;
      date?: string;
    }>;
    query_stats: {
      candidates_retrieved: number;
      final_results: number;
      reranker_used: boolean;
      canlii_used: boolean;
      tokens_generated: number;
    };
  }> => {
    const { data } = await apiClient.post('/criminal-law/rag/ask/', {
      query,
      alpha: options?.alpha ?? 0.5,
      limit: options?.limit ?? 10,
      use_reranker: options?.use_reranker ?? true,
    });
    return data;
  },

  /**
   * Streaming RAG query with Server-Sent Events
   * 
   * IMPORTANT: This uses native fetch instead of axios because
   * axios doesn't support SSE streaming properly.
   * 
   * @param query - The user's question
   * @param options - Configuration options (alpha, limit, etc.)
   * @param callbacks - Event handlers for streaming events
   */
  askRAGStream: async (
    query: string,
    options?: {
      alpha?: number;
      limit?: number;
      use_reranker?: boolean;
      use_canlii?: boolean;
    },
    callbacks?: {
      onStatus?: (status: string, message?: string) => void;
      onToken?: (token: string) => void;
      onComplete?: (metadata: any) => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> => {
    // Get base URL and token from your apiClient
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api';
    const token = localStorage.getItem('access_token');

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use native fetch for SSE support
      const response = await fetch(`${baseURL}/criminal-law/rag/ask-stream/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          alpha: options?.alpha ?? 0.5,
          limit: options?.limit ?? 10,
          use_reranker: options?.use_reranker ?? true,
          use_canlii: options?.use_canlii ?? false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Request failed'}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      // Read stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));

              // Handle different event types
              if (eventData.status === 'embedding' || 
                  eventData.status === 'searching' || 
                  eventData.status === 'reranking' || 
                  eventData.status === 'processing' || 
                  eventData.status === 'canlii' || 
                  eventData.status === 'generating') {
                callbacks?.onStatus?.(eventData.status, eventData.message);
              } else if (eventData.status === 'streaming' && eventData.token) {
                callbacks?.onToken?.(eventData.token);
              } else if (eventData.status === 'complete' && eventData.done) {
                callbacks?.onComplete?.(eventData.metadata);
              } else if (eventData.status === 'error') {
                callbacks?.onError?.(eventData.error);
                break;
              } else if (eventData.status === 'no_results') {
                callbacks?.onError?.(eventData.message || 'No relevant documents found.');
                break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE event:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      callbacks?.onError?.(error.message || 'Failed to process query');
      throw error;
    }
  },
};
