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
      <div className="flex items-center justify-center h-full" style={{ color: '#9ca3af' }}>
        <p style={{ fontFamily: '"Outfit", sans-serif' }}>No analysis available. Go back and run an analysis first.</p>
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .train-panel {
          font-family: 'Outfit', sans-serif;
          background: #f9fafb;
        }
        .train-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #111827;
        }
        .train-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .train-section-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #111827;
          margin-bottom: 16px;
        }
        .train-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
        }
        .train-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .train-result-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 24px;
        }
        .train-result-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #166534;
          margin-bottom: 12px;
        }
        .train-metric-card {
          background: #fff;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px;
        }
        .train-metric-label {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .train-metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .train-action-bar {
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
      <div className="p-6 space-y-8 max-w-4xl mx-auto train-panel">
        <div>
          <h1 className="train-heading">Configure & Train</h1>
          <p className="train-subtitle">Customize your model before training</p>
        </div>

        {/* Algorithm selection */}
        <div>
          <h3 className="train-section-heading">1. Select Algorithm</h3>
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
          <h3 className="train-section-heading">2. Select Features</h3>
          <div className="train-card">
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
          <h3 className="train-section-heading">3. Training Configuration</h3>
          <div className="train-card">
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
            className="train-result-card"
          >
            <h3 className="train-result-title">Training Complete!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trainingResult.version?.metrics &&
                Object.entries(trainingResult.version.metrics).map(([key, value]) => (
                  <div key={key} className="train-metric-card">
                    <p className="train-metric-label">{key}</p>
                    <p className="train-metric-value">
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
          <div className="train-action-bar">
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
    </>
  );
};
