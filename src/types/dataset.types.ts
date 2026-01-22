export interface Dataset {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: string;
  file: string;
  row_count: number;
  file_size: number;
  columns: DatasetColumn[];
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_accessed: string | null;
}

export interface DatasetColumn {
  name: string;
  type: string;
  nullable: boolean;
  unique: boolean;
  sample_values: string[];
}

export interface DatasetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Dataset[];
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  type: string;
  file: File;
}

// Data Insights Types
export interface DataQuality {
  overall_score: number;
  completeness: number;
  consistency: number;
  accuracy: number;
  recommendations: string[];
}

export interface BiasAnalysis {
  type: string;
  affected_column: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact_on_ml: string;
  how_to_fix: string;
}

export interface FeatureInsights {
  highly_predictive: string[];
  redundant: string[];
  needs_transformation: string[];
  feature_engineering_ideas: string[];
}

export interface MLReadiness {
  status: 'ready' | 'needs_work' | 'not_suitable';
  strengths: string[];
  weaknesses: string[];
  preprocessing_steps: string[];
  recommended_algorithms: string[];
}

export interface ProviderAnalysis {
  provider: string;
  data_quality: DataQuality;
  bias_analysis: BiasAnalysis[];
  feature_insights: FeatureInsights;
  ml_readiness: MLReadiness;
  summary: string;
}

export interface DataInsightsResponse {
  data_source_id: number;
  analyses: ProviderAnalysis[];
  comparison: {
    agreements: string[];
    disagreements: string[];
  };
}

export interface DataInsightsRequest {
  data_source_id: number;
  intent?: string;
  providers?: string[];
}