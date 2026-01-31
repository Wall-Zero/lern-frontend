import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Stage, WorkspaceMode, WorkspaceState, WorkspaceContextType, QuickTrainConfig, MergeFredConfig, DatasetMetadata } from '../types/workspace.types';
import type { DataInsightsResponse, MultiDatasetInsightsResponse } from '../types/dataset.types';
import { datasetsApi } from '../api/endpoints/datasets';
import { workspaceApi } from '../api/endpoints/workspace';
import toast from 'react-hot-toast';

const initialState: WorkspaceState = {
  stage: 'upload',
  workspaceMode: 'legal',
  userIntent: '',
  activeDataset: null,
  activeTool: null,
  rightPanel: 'hidden',
  isProcessing: false,
  datasets: [],
  previewData: null,
  previewColumns: [],
  metadata: null,
  dataInsights: null,
  // Multi-dataset comparison state
  compareDatasets: [],
  compareMetadata: {},
  comparePreviewData: {},
  multiDatasetInsights: null,
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WorkspaceState>(initialState);

  const refreshDatasets = useCallback(async () => {
    try {
      const response = await datasetsApi.list();
      setState((prev) => ({ ...prev, datasets: response.results }));
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  }, []);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  const selectDataset = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const [dataset, preview, metadataRes] = await Promise.all([
        datasetsApi.get(id),
        workspaceApi.getPreview(id, 50),
        workspaceApi.getMetadata(id).catch((err) => {
          console.warn('Metadata fetch failed (non-critical):', err);
          return null;
        }),
      ]);
      const metadata: DatasetMetadata | null = metadataRes?.metadata ?? null;
      // Use cached analysis if available
      const cachedInsights: DataInsightsResponse | null = dataset.analysis_cache ? {
        data_source: {
          id: dataset.id,
          name: dataset.name,
          type: dataset.type,
          row_count: dataset.row_count,
          column_count: dataset.columns?.length || 0,
        },
        intent: '',
        analyses: dataset.analysis_cache as any,
        comparison: { agreement: [], disagreement: [], unique_insights: {} },
      } : null;
      setState((prev) => ({
        ...prev,
        activeDataset: dataset,
        previewData: preview.data,
        previewColumns: preview.columns,
        metadata,
        dataInsights: cachedInsights,
        stage: 'explore',
        isProcessing: false,
      }));
    } catch (err) {
      console.error('Failed to load dataset:', err);
      toast.error('Failed to load dataset');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const uploadDataset = useCallback(async (file: File, name: string, description?: string) => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const ext = file.name.split('.').pop()?.toLowerCase() || 'csv';
      await datasetsApi.create({ name, description, type: ext, file });
      toast.success('Dataset uploaded successfully');
      await refreshDatasets();
      setState((prev) => ({ ...prev, isProcessing: false }));
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed');
      setState((prev) => ({ ...prev, isProcessing: false }));
      throw err;
    }
  }, [refreshDatasets]);

  const runAnalysis = useCallback(async (intent: string, aiModel: string = 'claude') => {
    if (!state.activeDataset) return;
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const tool = await workspaceApi.analyze({
        name: `${state.activeDataset.name} Analysis`,
        intent,
        data_source_id: state.activeDataset.id,
        ai_model: aiModel,
      });
      setState((prev) => ({
        ...prev,
        activeTool: tool,
        stage: 'insights',
        isProcessing: false,
      }));
    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Analysis failed');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.activeDataset]);

  const quickTrain = useCallback(async (config: QuickTrainConfig) => {
    if (!state.activeTool) return;
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const result = await workspaceApi.quickTrain(state.activeTool.id, config);
      setState((prev) => ({
        ...prev,
        activeTool: result.ai_tool,
        stage: 'predict',
        isProcessing: false,
      }));
      toast.success('Model trained successfully!');
    } catch (err) {
      console.error('Training failed:', err);
      toast.error('Training failed');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.activeTool]);

  const fetchDataInsights = useCallback(async (intent?: string, providers?: string[]) => {
    if (!state.activeDataset) return;
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const result: DataInsightsResponse = await workspaceApi.dataInsights({
        data_source_id: state.activeDataset.id,
        intent,
        providers: providers || ['claude', 'gemini'],
      });
      setState((prev) => ({
        ...prev,
        dataInsights: result,
        isProcessing: false,
      }));
      toast.success('Data insights generated');
    } catch (err) {
      console.error('Data insights failed:', err);
      toast.error('Failed to generate data insights');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.activeDataset]);

  const mergeFred = useCallback(async (config: MergeFredConfig) => {
    if (!state.activeDataset) return;
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      await workspaceApi.mergeFred(state.activeDataset.id, config);
      // Refresh dataset and preview
      const dataset = await datasetsApi.get(state.activeDataset.id);
      const preview = await workspaceApi.getPreview(state.activeDataset.id, 50);
      setState((prev) => ({
        ...prev,
        activeDataset: dataset,
        previewData: preview.data,
        previewColumns: preview.columns,
        isProcessing: false,
      }));
      toast.success('FRED data merged successfully');
    } catch (err) {
      console.error('Merge failed:', err);
      toast.error('Merge failed');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.activeDataset]);

  const setStage = useCallback((stage: Stage) => {
    setState((prev) => ({ ...prev, stage }));
  }, []);

  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => {
    setState((prev) => ({ ...prev, workspaceMode: mode }));
  }, []);

  const setUserIntent = useCallback((intent: string) => {
    setState((prev) => ({ ...prev, userIntent: intent }));
  }, []);

  const toggleMarketplace = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightPanel: prev.rightPanel === 'marketplace' ? 'hidden' : 'marketplace',
    }));
  }, []);

  const setIsProcessing = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: v }));
  }, []);

  const toggleCompareDataset = useCallback(async (id: number) => {
    const currentCompare = state.compareDatasets;
    const isAlreadyInCompare = currentCompare.some((ds) => ds.id === id);

    if (isAlreadyInCompare) {
      // Remove from comparison
      setState((prev) => {
        const newCompareDatasets = prev.compareDatasets.filter((ds) => ds.id !== id);
        const newCompareMetadata = { ...prev.compareMetadata };
        const newComparePreviewData = { ...prev.comparePreviewData };
        delete newCompareMetadata[id];
        delete newComparePreviewData[id];
        return {
          ...prev,
          compareDatasets: newCompareDatasets,
          compareMetadata: newCompareMetadata,
          comparePreviewData: newComparePreviewData,
          multiDatasetInsights: null, // Clear insights when selection changes
        };
      });
    } else {
      // Add to comparison - fetch metadata and preview
      try {
        const dataset = state.datasets.find((ds) => ds.id === id);
        if (!dataset) return;

        setState((prev) => ({ ...prev, isProcessing: true }));

        const [preview, metadataRes] = await Promise.all([
          workspaceApi.getPreview(id, 50),
          workspaceApi.getMetadata(id).catch((err) => {
            console.warn('Metadata fetch failed (non-critical):', err);
            return null;
          }),
        ]);

        const metadata: DatasetMetadata | null = metadataRes?.metadata ?? null;

        setState((prev) => ({
          ...prev,
          compareDatasets: [...prev.compareDatasets, dataset],
          compareMetadata: metadata ? { ...prev.compareMetadata, [id]: metadata } : prev.compareMetadata,
          comparePreviewData: { ...prev.comparePreviewData, [id]: preview.data },
          multiDatasetInsights: null, // Clear insights when selection changes
          isProcessing: false,
        }));
      } catch (err) {
        console.error('Failed to load dataset for comparison:', err);
        toast.error('Failed to add dataset to comparison');
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    }
  }, [state.compareDatasets, state.datasets]);

  const clearCompareDatasets = useCallback(() => {
    setState((prev) => ({
      ...prev,
      compareDatasets: [],
      compareMetadata: {},
      comparePreviewData: {},
      multiDatasetInsights: null,
    }));
  }, []);

  const deleteDataset = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      await datasetsApi.delete(id);
      toast.success('Deleted successfully');
      // Clear active dataset if it was the one deleted
      setState((prev) => ({
        ...prev,
        activeDataset: prev.activeDataset?.id === id ? null : prev.activeDataset,
        compareDatasets: prev.compareDatasets.filter((ds) => ds.id !== id),
        stage: prev.activeDataset?.id === id ? 'upload' : prev.stage,
        isProcessing: false,
      }));
      await refreshDatasets();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [refreshDatasets]);

  const fetchMultiDatasetInsights = useCallback(async (intent?: string, providers?: string[]) => {
    if (state.compareDatasets.length < 2) {
      toast.error('Select at least 2 datasets to compare');
      return;
    }
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      const dataSourceIds = state.compareDatasets.map((ds) => ds.id);
      const result: MultiDatasetInsightsResponse = await workspaceApi.dataInsights({
        data_source_ids: dataSourceIds,
        intent,
        providers: providers || ['claude', 'gemini'],
      });
      setState((prev) => ({
        ...prev,
        multiDatasetInsights: result,
        isProcessing: false,
      }));
      toast.success('Multi-dataset insights generated');
    } catch (err) {
      console.error('Multi-dataset insights failed:', err);
      toast.error('Failed to generate multi-dataset insights');
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [state.compareDatasets]);

  return (
    <WorkspaceContext.Provider
      value={{
        state,
        selectDataset,
        uploadDataset,
        runAnalysis,
        quickTrain,
        mergeFred,
        fetchDataInsights,
        setStage,
        setWorkspaceMode,
        setUserIntent,
        toggleMarketplace,
        refreshDatasets,
        setIsProcessing,
        toggleCompareDataset,
        clearCompareDatasets,
        fetchMultiDatasetInsights,
        deleteDataset,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};
