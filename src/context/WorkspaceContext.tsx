import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Stage, WorkspaceState, WorkspaceContextType, QuickTrainConfig, MergeFredConfig } from '../types/workspace.types';
import { datasetsApi } from '../api/endpoints/datasets';
import { workspaceApi } from '../api/endpoints/workspace';
import toast from 'react-hot-toast';

const initialState: WorkspaceState = {
  stage: 'upload',
  activeDataset: null,
  activeTool: null,
  rightPanel: 'hidden',
  isProcessing: false,
  datasets: [],
  previewData: null,
  previewColumns: [],
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
      const dataset = await datasetsApi.get(id);
      const preview = await workspaceApi.getPreview(id, 50);
      setState((prev) => ({
        ...prev,
        activeDataset: dataset,
        previewData: preview.data,
        previewColumns: preview.columns,
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

  const toggleMarketplace = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightPanel: prev.rightPanel === 'marketplace' ? 'hidden' : 'marketplace',
    }));
  }, []);

  const setIsProcessing = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: v }));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        state,
        selectDataset,
        uploadDataset,
        runAnalysis,
        quickTrain,
        mergeFred,
        setStage,
        toggleMarketplace,
        refreshDatasets,
        setIsProcessing,
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
