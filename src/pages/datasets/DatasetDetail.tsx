import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';
import { Button } from '../../components/common/Button';
import { ColumnSearch } from '../../components/dataset/ColumnSearch';

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

  const filteredColumns = dataset?.columns.filter((column) =>
    column.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dataset not found</h2>
          <Button onClick={() => navigate('/datasets')}>Back to Datasets</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/datasets')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
              {dataset.description && (
                <p className="text-gray-600 mt-1">{dataset.description}</p>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                dataset.status === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {dataset.status}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Rows</p>
              <p className="text-2xl font-bold text-gray-900">{dataset.row_count.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Columns</p>
              <p className="text-2xl font-bold text-gray-900">{dataset.columns.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">File Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(dataset.file_size)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <p className="text-2xl font-bold text-gray-900 uppercase">{dataset.type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columns List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Columns ({dataset.columns.length})
                  </h2>
                </div>
                <ColumnSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  totalColumns={dataset.columns.length}
                  filteredCount={filteredColumns.length}
                />
              </div>

              {/* Scrollable Table Container */}
              <div className="overflow-hidden" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Properties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sample Values
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredColumns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          No columns found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredColumns.map((column, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.01 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{column.name}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {column.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {column.unique && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                  Unique
                                </span>
                              )}
                              {column.nullable && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                  Nullable
                                </span>
                              )}
                              {!column.unique && !column.nullable && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {column.sample_values.slice(0, 3).map((value, i) => (
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
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Scroll Indicator */}
              {filteredColumns.length > 8 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    Scroll to see more columns
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full">
                  Download Dataset
                </Button>
                <Button variant="secondary" className="w-full text-red-600 hover:bg-red-50">
                  Delete Dataset
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                {dataset.last_accessed && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Accessed</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(dataset.last_accessed)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};