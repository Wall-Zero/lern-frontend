import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { Dataset } from '../../types/dataset.types';

interface DatasetCardProps {
  dataset: Dataset;
  onClick: () => void;
  onAnalyze?: () => void;
}

const statusConfig = {
  connected: { variant: 'success' as const, label: 'Ready' },
  pending: { variant: 'warning' as const, label: 'Processing' },
  error: { variant: 'error' as const, label: 'Error' },
};

export const DatasetCard = ({ dataset, onClick, onAnalyze }: DatasetCardProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      className="group transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary-300 hover:shadow-lg"
    >
      <div onClick={onClick}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {dataset.name}
            </h3>
            {dataset.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {dataset.description}
              </p>
            )}
          </div>
          <Badge variant={statusConfig[dataset.status as keyof typeof statusConfig]?.variant || 'info'}>
            {statusConfig[dataset.status as keyof typeof statusConfig]?.label || dataset.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Rows</p>
            <p className="text-sm font-semibold text-gray-900">
              {dataset.row_count?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Columns</p>
            <p className="text-sm font-semibold text-gray-900">
              {dataset.columns?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Size</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatFileSize(dataset.file_size)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Type</p>
            <p className="text-sm font-semibold text-gray-900 uppercase">
              {dataset.type}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created {formatDate(dataset.created_at)}
          </p>
          <button className="flex items-center gap-1 text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {dataset.status === 'connected' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze?.();
            }}
          >
            Analyze Dataset →
          </Button>
        </div>
      )}
    </Card>
  );
};