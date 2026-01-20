export interface AITool {
  id: number;
  name: string;
  description: string;
  tool_type: string;
  status: 'initial' | 'analyzing' | 'configuring' | 'configured' | 'code_ready' | 'training' | 'trained' | 'failed';
  data_source_id: number;
  data_source_name: string;
  intent?: string;
  ai_model?: string;
  version_count: number;
  active_version_number: number | null;
  config_snapshot?: AIToolConfig | null;
  active_version_data: Version | null;
  created_at: string;
  updated_at: string;
  config: AIToolConfig;
  analysis?: Analysis;
  generated_code?: string;
  code_generated_at?: string;
  versions: Version[];
}
export interface Version {
  id: number;
  version_number: number;
  model_algorithm: string;
  metrics: Metrics | Record<string, never>;
  feature_importance: Record<string, number>;
  onnx_model_url: string | null;
  training_duration: number | null;
  training_samples: number | null;
  test_samples: number | null;
  trained_at: string | null;
  created_at: string;
  is_active: boolean;
  status: string;
  logs?: string | null;
}

export interface Metrics {
  r2_score?: number;
  rmse?: number;
  mae?: number;
  mse?: number;
}
export interface Analysis {
  feasible: boolean;
  confidence: number;
  reasoning: string;
  approaches: Approach[];
  required_config: RequiredConfig;
  recommendations: string[];
  warnings: string[];
}

export interface Approach {
  name: string;
  algorithm: string;
  model_type: string;
  description: string;
  pros: string[];
  cons: string[];
  expected_accuracy: number;
  hyperparameters: Record<string, any>;
}

export interface RequiredConfig {
  target_column: string;
  feature_columns: FeatureColumn[];
  model_type: string;
  train_test_split: number;
  has_temporal_data: boolean;
  temporal_notes?: string;
}

export interface FeatureColumn {
  name: string;
  type?: string;
}

export interface AIToolConfig {
  selected_approach?: string;
  model_type?: string;
  target_column?: string;
  feature_columns?: FeatureColumn[];
  algorithm?: string;
  hyperparameters?: Record<string, any>;
  train_test_split?: number;
  random_state?: number;
  has_temporal_data?: string;
  temporal_column?: string;
}

export interface AIToolListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AITool[];
}

export interface AnalyzeRequest {
  data_source_id: number;
  name: string;
  intent?: string;
  ai_model: 'claude' | 'gemini' | 'gpt4';
}

export interface ConfigureRequest {
  selected_approach: string;
  model_type: string;
  target_column: string;
  feature_columns: FeatureColumn[];
  algorithm: string;
  hyperparameters: Record<string, any>;
  train_test_split: number;
  random_state: number;
  has_temporal_data: string;
  temporal_column?: string;
}