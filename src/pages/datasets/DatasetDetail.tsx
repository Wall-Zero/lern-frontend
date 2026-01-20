import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { ColumnSearch } from '../../components/dataset/ColumnSearch';
import { ChartIcon } from '../../components/common/Icons';

export const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDataset();
  }, [id]);

  const loadDataset = async () => {
    try {
      const data = await datasetsApi.get(Number(id));
      setDataset(data);
    } catch (error) {
      console.error('Failed to load dataset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    connected: { variant: 'success' as const, label: 'Ready' },
    pending: { variant: 'warning' as const, label: 'Processing' },
    error: { variant: 'error' as const, label: 'Error' },
  };

  const filteredColumns = dataset?.columns.filter((column) =>
    column.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dataset not found</h2>
        <Button onClick={() => navigate('/datasets')}>Back to Datasets</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <div>
        <button
          onClick={() => navigate('/datasets')}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Datasets
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
            {dataset.description && (
              <p className="text-gray-600 mt-2">{dataset.description}</p>
            )}
          </div>
          <Badge variant={statusConfig[dataset.status as keyof typeof statusConfig]?.variant || 'info'}>
            {statusConfig[dataset.status as keyof typeof statusConfig]?.label || dataset.status}
          </Badge>
        </div>
      </div>

      {dataset.status === 'connected' && (
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <ChartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ready to build your model?
                </h3>
                <p className="text-sm text-gray-600">
                  Create an AI-powered analysis to train ML models on this dataset
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="px-6 py-3 flex-shrink-0"
              onClick={() => navigate(`/analysis?dataset=${dataset.id}`)}
            >
              Start Analysis →
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Rows</p>
          <p className="text-3xl font-bold text-gray-900">{dataset.row_count?.toLocaleString() || 'N/A'}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Columns</p>
          <p className="text-3xl font-bold text-gray-900">{dataset.columns?.length || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">File Size</p>
          <p className="text-3xl font-bold text-gray-900">{formatFileSize(dataset.file_size)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Type</p>
          <p className="text-3xl font-bold text-gray-900 uppercase">{dataset.type}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Columns ({dataset.columns?.length || 0})
              </h2>
              <ColumnSearch
                value={searchQuery}
                onChange={setSearchQuery}
                totalColumns={dataset.columns?.length || 0}
                filteredCount={filteredColumns.length}
              />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Sample Values
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredColumns.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        No columns found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredColumns.map((column, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{column.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info">{column.type || column.dtype}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {column.sample_values?.slice(0, 3).map((value, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded truncate max-w-[100px]"
                                title={value}
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full">
                Download Dataset
              </Button>
              <Button variant="danger" className="w-full">
                Delete Dataset
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(dataset.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(dataset.updated_at)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};