import apiClient from '../client';
import type {
  MarketplaceCatalog,
  SuggestRequest,
  SuggestResponse,
  FetchRequest,
  FetchResponse,
  MergeRequest,
  MergeResponse,
  EnrichRequest,
  EnrichResponse,
} from '../../types/marketplace.types';

export const marketplaceApi = {
  getCatalog: async (): Promise<MarketplaceCatalog> => {
    const response = await apiClient.get('/features/marketplace/');
    return response.data;
  },

  getSuggestions: async (request: SuggestRequest): Promise<SuggestResponse> => {
    const response = await apiClient.post('/features/marketplace/suggest/', request);
    return response.data;
  },

  fetchExternalData: async (request: FetchRequest): Promise<FetchResponse> => {
    const response = await apiClient.post('/features/marketplace/fetch/', request);
    return response.data;
  },

  mergeData: async (request: MergeRequest): Promise<MergeResponse> => {
    const response = await apiClient.post('/features/marketplace/merge/', request);
    return response.data;
  },

  enrichWithContext: async (request: EnrichRequest): Promise<EnrichResponse> => {
    const response = await apiClient.post('/features/marketplace/enrich/', request);
    return response.data;
  },
};
