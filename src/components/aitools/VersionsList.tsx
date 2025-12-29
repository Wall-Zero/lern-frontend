import { motion } from 'framer-motion';
import type { Version } from '../../types/aitools.types';

interface VersionsListProps {
  versions: Version[];
  activeVersion: number | null;
}

export const VersionsList = ({ versions }: VersionsListProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Training History</h3>
        <p className="text-sm text-gray-600">{versions.length} version(s)</p>
      </div>
      <div className="divide-y divide-gray-200">
        {versions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No training versions yet
          </div>
        ) : (
          versions.map((version) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    v{version.version_number}
                  </span>
                  {version.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    version.status === 'ready' ? 'bg-blue-100 text-blue-700' : 
                    version.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {version.status}
                  </span>
                </div>
                {version.onnx_model_url && (
                    <a  
                    href={version.onnx_model_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Download ONNX
                  </a>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {version.model_algorithm} 
                {version.trained_at && ` • Trained ${formatDate(version.trained_at)}`}
                {!version.trained_at && version.created_at && ` • Created ${formatDate(version.created_at)}`}
              </p>

              {version.status === 'failed' && version.logs && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-red-900 mb-1">Error:</p>
                  <p className="text-xs text-red-800 line-clamp-3">{version.logs}</p>
                </div>
              )}

              {version.status === 'ready' && version.metrics && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">R² Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {version.metrics.r2_score?.toFixed(3) ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">RMSE</p>
                    <p className="text-lg font-bold text-gray-900">
                      {version.metrics.rmse?.toFixed(3) ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="text-lg font-bold text-gray-900">
                      {version.training_duration !== null 
                        ? `${version.training_duration.toFixed(2)}s` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Samples</p>
                    <p className="text-lg font-bold text-gray-900">
                      {version.training_samples !== null && version.test_samples !== null
                        ? version.training_samples + version.test_samples
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};