// src/context/CriminalLawContext.tsx

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { criminalLawApi } from '../api/endpoints/criminalLaw';
import type { Article, ArticleDetail, SearchFilters, Statistics } from '../types/criminalLaw.types';

interface CriminalLawState {
  articles: Article[];
  selectedArticle: ArticleDetail | null;
  volumes: string[];
  statistics: Statistics | null;
  filters: SearchFilters;
  searchQuery: string;
  searchType: 'text' | 'semantic';
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface CriminalLawContextValue {
  state: CriminalLawState;
  fetchArticles: () => Promise<void>;
  fetchArticle: (id: number) => Promise<void>;
  searchArticles: (query: string) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSearchType: (type: 'text' | 'semantic') => void;
  closeArticle: () => void;
  fetchVolumes: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
}

const CriminalLawContext = createContext<CriminalLawContextValue | undefined>(undefined);

export const CriminalLawProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CriminalLawState>({
    articles: [],
    selectedArticle: null,
    volumes: [],
    statistics: null,
    filters: {},
    searchQuery: '',
    searchType: 'text',
    pagination: {
      page: 1,
      pageSize: 20,
      totalPages: 0,
      totalCount: 0,
    },
    isLoading: false,
    error: null,
  });

  const fetchArticles = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await criminalLawApi.getArticles({
        ...state.filters,
        page: state.pagination.page,
        page_size: state.pagination.pageSize,
      });
      setState((prev) => ({
        ...prev,
        articles: data.results,
        pagination: {
          ...prev.pagination,
          totalPages: data.total_pages,
          totalCount: data.count,
        },
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Failed to load articles' }));
    }
  }, [state.filters, state.pagination.page, state.pagination.pageSize]);

  const fetchArticle = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const article = await criminalLawApi.getArticle(id);
      setState((prev) => ({ ...prev, selectedArticle: article, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Failed to load article' }));
    }
  }, []);

  const searchArticles = useCallback(
    async (query: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null, searchQuery: query }));
      try {
        if (state.searchType === 'text') {
          const data = await criminalLawApi.searchText(query, {
            ...state.filters,
            page: state.pagination.page,
            page_size: state.pagination.pageSize,
          });
          setState((prev) => ({
            ...prev,
            articles: data.results as Article[],
            pagination: {
              ...prev.pagination,
              totalPages: data.total_pages,
              totalCount: data.count,
            },
            isLoading: false,
          }));
        } else {
          const data = await criminalLawApi.searchSemantic({
            query,
            limit: state.pagination.pageSize,
            similarity_threshold: 0.7,
            ...state.filters,
          });
          setState((prev) => ({
            ...prev,
            articles: data.results as Article[],
            pagination: { ...prev.pagination, totalPages: 1, totalCount: data.total_results },
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'Search failed' }));
      }
    },
    [state.searchType, state.filters, state.pagination.page, state.pagination.pageSize]
  );

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {},
      searchQuery: '',
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  const setSearchType = useCallback((type: 'text' | 'semantic') => {
    setState((prev) => ({ ...prev, searchType: type }));
  }, []);

  const closeArticle = useCallback(() => {
    setState((prev) => ({ ...prev, selectedArticle: null }));
  }, []);

  const fetchVolumes = useCallback(async () => {
    try {
      const volumes = await criminalLawApi.getVolumes();
      setState((prev) => ({ ...prev, volumes }));
    } catch (error) {
      console.error('Failed to fetch volumes:', error);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const statistics = await criminalLawApi.getStats();
      setState((prev) => ({ ...prev, statistics }));
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, []);

  // CRITICAL: Auto-refetch when filters or page changes (but NOT during search)
  useEffect(() => {
    // Don't auto-fetch if user is actively searching
    if (!state.searchQuery) {
      fetchArticles();
    }
  }, [state.filters, state.pagination.page]);

  return (
    <CriminalLawContext.Provider
      value={{
        state,
        fetchArticles,
        fetchArticle,
        searchArticles,
        setFilters,
        clearFilters,
        setPage,
        setSearchType,
        closeArticle,
        fetchVolumes,
        fetchStatistics,
      }}
    >
      {children}
    </CriminalLawContext.Provider>
  );
};

export const useCriminalLaw = () => {
  const context = useContext(CriminalLawContext);
  if (!context) {
    throw new Error('useCriminalLaw must be used within CriminalLawProvider');
  }
  return context;
};