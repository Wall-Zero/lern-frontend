import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import type { RecentAnalysis } from '../../api/endpoints/dashboard';

interface QuickActionsProps {
  recentAnalysis: RecentAnalysis[];
}

const statusConfig = {
  configuring: { variant: 'warning' as const, label: 'Configuring' },
  training: { variant: 'info' as const, label: 'Training' },
  trained: { variant: 'success' as const, label: 'Trained' },
  analyzing: { variant: 'info' as const, label: 'Analyzing' },
};

export const QuickActions = ({ recentAnalysis }: QuickActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Upload Dataset Card */}
      <Card className="flex flex-col items-center justify-center text-center p-8">
        <div className="text-5xl mb-4">📤</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New Dataset</h3>
        <p className="text-sm text-gray-600 mb-4">Start by uploading your data</p>
        <Button onClick={() => navigate('/datasets')} variant="primary">
          Upload Dataset
        </Button>
      </Card>

      {/* Recent Analysis Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis</h3>
        {recentAnalysis.length === 0 ? (
          <p className="text-sm text-gray-600">No analysis yet</p>
        ) : (
          <div className="space-y-3">
            {recentAnalysis.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{analysis.name}</p>
                  <Badge variant={statusConfig[analysis.status].variant}>
                    {statusConfig[analysis.status].label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{analysis.data_source_name}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Models Card */}
      <Card className="flex flex-col items-center justify-center text-center p-8">
        <div className="text-5xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Models</h3>
        <p className="text-sm text-gray-600 mb-4">View your trained models</p>
        <Button onClick={() => navigate('/analysis')} variant="secondary">
          View All
        </Button>
      </Card>
    </div>
  );
};