import { WorkspaceProvider } from '../../context/WorkspaceContext';
import { StageHeader } from '../../components/workspace/StageHeader';
import { DatasetSidebar } from '../../components/workspace/DatasetSidebar';
import { WorkspaceContent } from '../../components/workspace/WorkspaceContent';
import { MarketplacePanel } from '../../components/workspace/MarketplacePanel';

export const Workspace = () => {
  return (
    <WorkspaceProvider>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          background: '#f9fafb',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <DatasetSidebar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <StageHeader />
          <WorkspaceContent />
        </div>
        <MarketplacePanel />
      </div>
    </WorkspaceProvider>
  );
};
