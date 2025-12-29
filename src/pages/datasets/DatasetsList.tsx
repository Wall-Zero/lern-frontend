import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';
import { DatasetCard } from '../../components/dataset/DatasetCard';
import { UploadDatasetModal } from '../../components/dataset/UploadDatasetModal';
import { Button } from '../../components/common/Button';
import { AppLayout } from '../../components/layout/AppLayout';

export const DatasetsList = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await datasetsApi.list();
      setDatasets(response.results);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: any) => {
    await datasetsApi.create(data);
    await loadDatasets();
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
          <AppLayout>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Datasets</h2>
            <p className="text-gray-600 mt-1">Manage your data sources for ML training</p>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Dataset
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No datasets yet</h3>
            <p className="text-gray-600 mb-6">Upload your first dataset to get started with ML training</p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              Upload Your First Dataset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onClick={() => navigate(`/datasets/${dataset.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
          </AppLayout>

    </div>
  );
};