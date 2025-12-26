import type { Dataset } from '../../types/dataset.types';

interface DatasetCardProps {
  dataset: Dataset;
  onClick: () => void;
}

export const DatasetCard = ({ dataset, onClick }: DatasetCardProps) => {
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
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{dataset.name}</h3>
          {dataset.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            dataset.status === 'connected'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {dataset.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Rows</p>
          <p className="text-sm font-semibold text-gray-900">{dataset.row_count.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Columns</p>
          <p className="text-sm font-semibold text-gray-900">{dataset.columns.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Size</p>
          <p className="text-sm font-semibold text-gray-900">{formatFileSize(dataset.file_size)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Type</p>
          <p className="text-sm font-semibold text-gray-900 uppercase">{dataset.type}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Created {formatDate(dataset.created_at)}
        </p>
      </div>
    </div>
  );
};