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