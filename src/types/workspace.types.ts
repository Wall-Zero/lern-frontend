import type { Dataset, DataInsightsResponse, MultiDatasetInsightsResponse } from './dataset.types';
import type { AITool } from './aitools.types';

export type Stage = 'upload' | 'explore' | 'insights' | 'train' | 'predict';
export type WorkspaceMode = 'legal' | 'data';

export interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'datetime' | 'categorical';
  non_null: number;
  null_count: number;
  unique_values: number;
  stats: {
    min?: number | string | null;
    max?: number | string | null;
    mean?: number | null;
    std?: number | null;
    unique_count?: number;
    most_common?: string | null;
  };
}

export interface DatasetMetadata {
  row_count: number;
  column_count: number;
  columns: ColumnMetadata[];
  memory_usage_mb: number;
  sample_size: number;
}

export interface CompareMetadata {
  [datasetId: number]: DatasetMetadata;
}

export interface ComparePreviewData {
  [datasetId: number]: Record<string, any>[];
}

export interface WorkspaceState {
  stage: Stage;
  workspaceMode: WorkspaceMode;
  userIntent: string;
  activeDataset: Dataset | null;
  activeTool: AITool | null;
  rightPanel: 'hidden' | 'marketplace';
  isProcessing: boolean;
  datasets: Dataset[];
  previewData: Record<string, any>[] | null;
  previewColumns: string[];
  metadata: DatasetMetadata | null;
  dataInsights: DataInsightsResponse | null;
  // Multi-dataset comparison state
  compareDatasets: Dataset[];
  compareMetadata: CompareMetadata;
  comparePreviewData: ComparePreviewData;
  multiDatasetInsights: MultiDatasetInsightsResponse | null;
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
  fetchDataInsights: (intent?: string, providers?: string[]) => Promise<void>;
  setStage: (stage: Stage) => void;
  setUserIntent: (intent: string) => void;
  toggleMarketplace: () => void;
  refreshDatasets: () => Promise<void>;
  setIsProcessing: (v: boolean) => void;
  // Multi-dataset comparison
  toggleCompareDataset: (id: number) => Promise<void>;
  clearCompareDatasets: () => void;
  fetchMultiDatasetInsights: (intent?: string, providers?: string[]) => Promise<void>;
  // Delete
  deleteDataset: (id: number) => Promise<void>;
  // URL-driven tool selection
  pendingTool: string | null;
  clearPendingTool: () => void;
}
