// src/types/criminalLaw.types.ts

export interface Article {
  id: number;
  title: string;
  url: string;
  volume: string | null;
  section: string | null;
  criminal_code_section: string | null;
  status: 'valid' | 'history' | 'repealed_law' | 'case_digest' | 'practice_guide';
  word_count: number;
  categories: string[];
  content_preview: string;
  case_count: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleDetail extends Article {
  content: string;
  validation_confidence: number | null;
  validation_reason: string | null;
  scraped_at: string | null;
  last_modified: string | null;
  metadata: Record<string, any>;
  is_current_law: boolean;
  chunks: Chunk[];
  case_references: CaseReference[];
}

export interface Chunk {
  id: number;
  chunk_number: number;
  total_chunks: number;
  chunk_text: string;
  word_count: number;
}

export interface CaseReference {
  id: number;
  case_url: string;
  case_name: string | null;
  case_year: string | null;
  context: string | null;
}

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  volume: string | null;
  section: string | null;
  criminal_code_section: string | null;
  status: string;
  word_count: number;
  categories: string[];
  content_preview: string;
  case_count: number;
  relevance_score?: number;
  similarity?: number;
  chunk_id?: number;
  chunk_text?: string;
  chunk_number?: number;
  total_chunks?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export interface SearchFilters {
  volume?: string;
  status?: string;
  categories?: string;
  page?: number;
  page_size?: number;
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
  similarity_threshold?: number;
  volume?: string;
  status?: string;
}

export interface Statistics {
  total_articles: number;
  by_status: Record<string, number>;
  by_volume: { volume: string; count: number }[];
  total_chunks: number;
  avg_chunks_per_article: number;
  total_case_references: number;
  updated_last_week: number;
}