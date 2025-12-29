import { motion } from 'framer-motion';
import type { AITool } from '../../types/aitools.types';

interface AIToolCardProps {
  tool: AITool;
  onClick: () => void;
}

export const AIToolCard = ({ tool, onClick }: AIToolCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      initial: 'bg-gray-100 text-gray-700',
      analyzing: 'bg-blue-100 text-blue-700',
      configuring: 'bg-yellow-100 text-yellow-700',
      configured: 'bg-green-100 text-green-700',
      code_ready: 'bg-purple-100 text-purple-700',
      training: 'bg-orange-100 text-orange-700',
      trained: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.initial;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'analyzing' || status === 'training') {
      return (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{tool.name}</h3>
          <p className="text-sm text-gray-600">{tool.data_source_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(tool.status)}`}>
          {getStatusIcon(tool.status)}
          {tool.status.replace('_', ' ')}
        </span>
      </div>

      {tool.intent && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Intent</p>
          <p className="text-sm text-gray-700 line-clamp-2">{tool.intent}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 
        <div>
          <p className="text-xs text-gray-500 mb-1">AI Model</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">{tool.ai_model || 'N/A'}</p>
        </div>
         */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Versions</p>
          <p className="text-sm font-semibold text-gray-900">{tool.version_count}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">Created {formatDate(tool.created_at)}</p>
      </div>
    </motion.div>
  );
};