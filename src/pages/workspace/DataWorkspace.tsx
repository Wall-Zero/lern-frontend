import { useSearchParams } from 'react-router-dom';
import { WorkspaceProvider } from '../../context/WorkspaceContext';
import { WorkspaceInner } from './WorkspaceInner';

export const DataWorkspace = () => {
  const [searchParams] = useSearchParams();
  const initialTool = searchParams.get('tool');

  return (
    <WorkspaceProvider initialTool={initialTool} initialMode="data">
      <WorkspaceInner />
    </WorkspaceProvider>
  );
};
