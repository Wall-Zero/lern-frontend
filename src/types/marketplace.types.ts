// Marketplace Catalog Types
export interface SeriesInfo {
  id: string;
  name: string;
  frequency: string;
}

export interface CategoryData {
  [seriesId: string]: SeriesInfo;
}

export interface MarketplaceCatalog {
  market_indices: CategoryData;
  volatility: CategoryData;
  interest_rates: CategoryData;
  commodities: CategoryData;
  currency: CategoryData;
  economic_indicators: CategoryData;
}

// AI Suggestions Types
export interface AISuggestion {
  series_id: string;
  series_name?: string;
  relevance_score: number;
  reasoning: string;
  how_to_merge: string;
  expected_benefit: string;
}

export interface SuggestRequest {
  data_source_id: number;
  intent?: string;
  context?: string;
}

export interface SuggestResponse {
  suggestions: AISuggestion[];
}

// Fetch External Data Types
export interface FetchRequest {
  source: 'fred';
  series_id: string;
  start_date?: string;
  end_date?: string;
}

export interface FetchResponse {
  series_info: {
    id: string;
    title: string;
    frequency: string;
    units: string;
  };
  row_count: number;
  date_range: {
    start: string;
    end: string;
  };
  preview: Array<{ date: string; value: number }>;
  full_data: Array<{ date: string; value: number }>;
}

// Merge Types
export interface ExternalDataSource {
  source: 'fred';
  series_id: string;
  column_name: string;
  start_date?: string;
  end_date?: string;
}

export interface MergeRequest {
  data_source_id: number;
  merge_column: string;
  merge_strategy: 'left' | 'right' | 'inner' | 'outer';
  external_data: ExternalDataSource[];
}

export interface MergeResponse {
  original_rows: number;
  merged_rows: number;
  new_columns: string[];
  preview: Record<string, any>[];
  full_data: Record<string, any>[];
}

// Enrich/Context Types
export interface EnrichRequest {
  data_source_id: number;
  context: string;
  domain_knowledge?: string[];
  known_issues?: string[];
  analysis_goals?: string[];
}

export interface EnrichResponse {
  understanding: string;
  prioritized_recommendations: string[];
  external_data_suggestions: AISuggestion[];
  potential_pitfalls: string[];
  next_steps: string[];
}
