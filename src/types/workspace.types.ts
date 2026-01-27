import type { Dataset } from './dataset.types';
import type { AITool } from './aitools.types';

export type Stage = 'upload' | 'explore' | 'insights' | 'train' | 'predict';

export interface WorkspaceState {
  stage: Stage;
  activeDataset: Dataset | null;
  activeTool: AITool | null;
  rightPanel: 'hidden' | 'marketplace';
  isProcessing: boolean;
  datasets: Dataset[];
  previewData: Record<string, any>[] | null;
  previewColumns: string[];
}

export interface QuickTrainConfig {
  approach_index: number;
  target_column: string;
  feature_columns: string[];
  train_test_split: number;
  has_temporal_data?: boolean;
  temporal_column?: string;
}

export interface MergeFredConfig {
  series_ids: string[];
  date_column: string;
  fill_strategy: 'forward' | 'backward';
}

export interface FredSeries {
  id: string;
  title: string;
  frequency: string;
  units: string;
  seasonal_adjustment: string;
  last_updated: string;
  popularity: number;
  observation_start: string;
  observation_end: string;
}

export interface FredBrowseResponse {
  success: boolean;
  query: string;
  count: number;
  results: FredSeries[];
}

export interface WorkspaceContextType {
  state: WorkspaceState;
  selectDataset: (id: number) => Promise<void>;
  uploadDataset: (file: File, name: string, description?: string) => Promise<void>;
  runAnalysis: (intent: string, aiModel?: string) => Promise<void>;
  quickTrain: (config: QuickTrainConfig) => Promise<void>;
  mergeFred: (config: MergeFredConfig) => Promise<void>;
  setStage: (stage: Stage) => void;
  toggleMarketplace: () => void;
  refreshDatasets: () => Promise<void>;
  setIsProcessing: (v: boolean) => void;
}
