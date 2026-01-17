import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';
import { DatasetCard } from '../../components/dataset/DatasetCard';
import { EmptyDatasets } from '../../components/dataset/EmptyDatasets';
import { UploadDatasetModal } from '../../components/dataset/UploadDatasetModal';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { UploadIcon } from '../../components/common/Icons';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Datasets</h2>
          <p className="text-gray-600 mt-1">Manage your data sources for ML training</p>
        </div>
        {datasets.length > 0 && (
          <Button onClick={() => setIsUploadModalOpen(true)} variant="primary">
            <UploadIcon className="w-5 h-5 mr-2" />
            Upload Dataset
          </Button>
        )}
      </div>

      {datasets.length === 0 ? (
        <EmptyDatasets onUpload={() => setIsUploadModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onClick={() => navigate(`/datasets/${dataset.id}`)}
              onAnalyze={() => navigate(`/analysis?dataset=${dataset.id}`)}
            />
          ))}
        </div>
      )}

      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};