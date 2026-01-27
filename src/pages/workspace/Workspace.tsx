import { WorkspaceProvider } from '../../context/WorkspaceContext';
import { StageHeader } from '../../components/workspace/StageHeader';
import { DatasetSidebar } from '../../components/workspace/DatasetSidebar';
import { WorkspaceContent } from '../../components/workspace/WorkspaceContent';
import { MarketplacePanel } from '../../components/workspace/MarketplacePanel';

export const Workspace = () => {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-gray-50">
        <DatasetSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StageHeader />
          <WorkspaceContent />
        </div>
        <MarketplacePanel />
      </div>
    </WorkspaceProvider>
  );
};
