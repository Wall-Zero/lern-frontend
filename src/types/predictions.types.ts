export interface PredictionResult {
  sample_index: number;
  input: Record<string, any>;
  prediction: number;
  target_column: string;
}

export interface PredictionResponse {
  success: boolean;
  predictions: PredictionResult[];
}

export interface ValidationResult {
  required: string[];
  missing: string[];
  extra: string[];
  isValid: boolean;
}

export type PredictionState = 'idle' | 'validating' | 'ready' | 'predicting' | 'success' | 'error';