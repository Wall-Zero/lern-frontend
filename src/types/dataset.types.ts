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
export interface DataInsightsResponse {
  data_source: {
    id: number;
    name: string;
    type: string;
    row_count: number;
    column_count: number;
  };
  intent: string;
  analyses: {
    claude?: ProviderAnalysisResult;
    gemini?: ProviderAnalysisResult;
  };
  comparison: {
    agreement: string[];
    disagreement: string[];
    unique_insights: {
      claude?: { biases_detected: string[] };
      gemini?: { biases_detected: string[] };
    };
  };
}

export interface ProviderAnalysisResult {
  success: boolean;
  data_quality: {
    overall_score: number;
    completeness: {
      score: number;
      missing_data_columns: string[];
      recommendation: string;
    };
    consistency: {
      score: number;
      issues: string[];
      recommendation: string;
    };
    accuracy: {
      score: number;
      potential_errors: string[];
      recommendation: string;
    };
  };
  bias_analysis: {
    detected_biases: {
      type: string;
      column: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      impact: string;
      mitigation: string;
    }[];
    fairness_concerns: string[];
    recommendations: string[];
  };
  feature_insights: {
    highly_predictive: string[];
    potentially_redundant: string[];
    needs_transformation: {
      column: string;
      issue: string;
      suggested_transform: string;
    }[];
    feature_engineering_ideas: string[];
  };
  ml_readiness: {
    overall_readiness: 'ready' | 'needs_work' | 'not_suitable';
    strengths: string[];
    weaknesses: string[];
    recommended_preprocessing: string[];
    suitable_algorithms: string[];
    expected_challenges: string[];
  };
  summary: string;
  provider: string;
}

export interface DataInsightsRequest {
  data_source_id: number;
  intent?: string;
  providers?: string[];
}

// Multi-Dataset Analysis Types
export interface MultiDatasetInsightsRequest {
  data_source_ids: number[];
  intent?: string;
  providers?: string[];
}

export interface CrossDatasetCorrelation {
  dataset_a_id: number;
  dataset_a_column: string;
  dataset_b_id: number;
  dataset_b_column: string;
  relationship: string;
  confidence: number;
}

export interface SchemaCompatibility {
  can_merge: boolean;
  suggested_join_keys: string[];
  type_conflicts: { column: string; types: string[] }[];
}

export interface MergeRecommendation {
  strategy: 'inner' | 'left' | 'right' | 'outer';
  reasoning: string;
}

export interface EnrichmentOpportunity {
  source_dataset_id: number;
  target_dataset_id: number;
  description: string;
  columns_to_add: string[];
  join_on: string | null;
}

export interface DataQualityComparison {
  better_quality_dataset: number | null;
  quality_notes: string;
}

export interface CrossDatasetAnalysis {
  datasets_useful_together: boolean;
  usefulness_explanation: string;
  correlations: CrossDatasetCorrelation[];
  enrichment_opportunities: EnrichmentOpportunity[];
  schema_compatibility: SchemaCompatibility;
  merge_recommendations: MergeRecommendation;
  combined_insights: string[];
  data_quality_comparison: DataQualityComparison;
}

export interface MultiDatasetInsightsResponse {
  data_sources: { id: number; name: string; row_count: number; column_count: number }[];
  intent: string;
  analyses: {
    [dataSourceId: number]: {
      claude?: ProviderAnalysisResult;
      gemini?: ProviderAnalysisResult;
    };
  };
  cross_dataset_analysis: CrossDatasetAnalysis;
}