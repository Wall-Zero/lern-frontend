import { useWorkspace } from '../../context/WorkspaceContext';
import { UploadPanel } from './panels/UploadPanel';
import { ExplorePanel } from './panels/ExplorePanel';
import { InsightsPanel } from './panels/InsightsPanel';
import { TrainPanel } from './panels/TrainPanel';
import { PredictPanel } from './panels/PredictPanel';

export const WorkspaceContent = () => {
  const { state } = useWorkspace();

  const panels = {
    upload: <UploadPanel />,
    explore: <ExplorePanel />,
    insights: <InsightsPanel />,
    train: <TrainPanel />,
    predict: <PredictPanel />,
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {panels[state.stage]}
    </div>
  );
};
