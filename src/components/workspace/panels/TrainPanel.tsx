import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { AlgorithmCard } from '../../analysis/AlgorithmCard';
import { FeatureSelector } from '../../analysis/FeatureSelector';
import { TrainingConfig } from '../../analysis/TrainingConfig';
import { Button } from '../../common/Button';
import { aitoolsApi } from '../../../api/endpoints/aitools';
import toast from 'react-hot-toast';

export const TrainPanel = () => {
  const { state, setStage } = useWorkspace();
  const { activeTool, activeDataset } = state;

  const [selectedApproachIdx, setSelectedApproachIdx] = useState(0);
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hasTemporalData, setHasTemporalData] = useState(false);
  const [temporalColumn, setTemporalColumn] = useState('');
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [hyperparameters, setHyperparameters] = useState<Record<string, any>>({});
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  // Initialize from analysis
  useEffect(() => {
    if (activeTool?.analysis?.required_config) {
      const rc = activeTool.analysis.required_config;
      setTargetColumn(rc.target_column || '');
      setSelectedFeatures(
        (rc.feature_columns || []).map((f) => (typeof f === 'string' ? f : f.name))
      );
      setHasTemporalData(rc.has_temporal_data || false);
      setTrainTestSplit(rc.train_test_split || 0.8);
    }
    if (activeTool?.analysis?.approaches?.[0]?.hyperparameters) {
      setHyperparameters(activeTool.analysis.approaches[0].hyperparameters);
    }
  }, [activeTool]);

  if (!activeTool || !activeTool.analysis) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No analysis available. Go back and run an analysis first.</p>
      </div>
    );
  }

  const analysis = activeTool.analysis;
  const approaches = analysis.approaches || [];
  const features = (activeDataset?.columns || []).map((c) => ({
    name: c.name,
    type: c.type,
  }));

  const handleApproachSelect = (idx: number) => {
    setSelectedApproachIdx(idx);
    if (approaches[idx]?.hyperparameters) {
      setHyperparameters(approaches[idx].hyperparameters);
    }
  };

  const handleTrain = async () => {
    if (!targetColumn || selectedFeatures.length === 0) {
      toast.error('Please select target and feature columns');
      return;
    }

    setIsTraining(true);
    try {
      // Configure
      await aitoolsApi.configure(activeTool.id, {
        selected_approach: approaches[selectedApproachIdx]?.name || '',
        model_type: approaches[selectedApproachIdx]?.model_type || 'regression',
        target_column: targetColumn,
        feature_columns: selectedFeatures.map((f) => ({ name: f })),
        algorithm: approaches[selectedApproachIdx]?.algorithm || '',
        hyperparameters,
        train_test_split: trainTestSplit,
        random_state: 42,
        has_temporal_data: hasTemporalData ? 'true' : 'false',
        temporal_column: temporalColumn || undefined,
      });

      // Train
      const result = await aitoolsApi.trainDirect(activeTool.id);
      setTrainingResult(result);
      toast.success('Model trained successfully!');
    } catch (err) {
      console.error('Training failed:', err);
      toast.error('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configure & Train</h1>
        <p className="text-sm text-gray-500 mt-1">Customize your model before training</p>
      </div>

      {/* Algorithm selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select Algorithm</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {approaches.map((approach, idx) => (
            <AlgorithmCard
              key={idx}
              algorithm={approach}
              isRecommended={idx === 0}
              isSelected={idx === selectedApproachIdx}
              onClick={() => handleApproachSelect(idx)}
            />
          ))}
        </div>
      </div>

      {/* Feature selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Select Features</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <FeatureSelector
            features={features}
            selectedFeatures={selectedFeatures}
            targetColumn={targetColumn}
            temporalColumn={temporalColumn}
            hasTemporalData={hasTemporalData}
            onFeaturesChange={setSelectedFeatures}
            onTargetChange={setTargetColumn}
            onTemporalChange={setTemporalColumn}
            onHasTemporalChange={setHasTemporalData}
          />
        </div>
      </div>

      {/* Training config */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Training Configuration</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <TrainingConfig
            trainTestSplit={trainTestSplit}
            hyperparameters={hyperparameters}
            onSplitChange={setTrainTestSplit}
            onHyperparametersChange={setHyperparameters}
          />
        </div>
      </div>

      {/* Training result */}
      {trainingResult && trainingResult.success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-green-800 mb-3">Training Complete!</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trainingResult.version?.metrics &&
              Object.entries(trainingResult.version.metrics).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-500 uppercase">{key}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </p>
                </div>
              ))}
          </div>
          <Button onClick={() => setStage('predict')} className="mt-4">
            Go to Predictions
          </Button>
        </motion.div>
      )}

      {/* Train button */}
      {!trainingResult && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleTrain}
            isLoading={isTraining}
            disabled={!targetColumn || selectedFeatures.length === 0 || isTraining}
            className="w-full"
          >
            {isTraining ? 'Training model...' : 'Start Training'}
          </Button>
        </div>
      )}
    </div>
  );
};
