import { Button } from '../common/Button';
import { DatabaseIcon } from '../common/Icons';

interface EmptyDatasetsProps {
  onUpload: () => void;
}

export const EmptyDatasets = ({ onUpload }: EmptyDatasetsProps) => {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
        <DatabaseIcon className="w-10 h-10 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No datasets yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Upload your first dataset to start training ML models. We support CSV files with structured data.
      </p>
      <Button onClick={onUpload} variant="primary" className="px-6 py-3">
        Upload Your First Dataset
      </Button>
    </div>
  );
};