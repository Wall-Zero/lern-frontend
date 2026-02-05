import { Navigate, useSearchParams } from 'react-router-dom';

export const Workspace = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const tool = searchParams.get('tool');

  const base = mode === 'data' ? '/data' : '/legal';
  const search = tool ? `?tool=${tool}` : '';

  return <Navigate to={`${base}${search}`} replace />;
};
