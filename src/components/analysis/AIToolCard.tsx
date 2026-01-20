import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import type { AITool } from '../../types/aitools.types';

interface AIToolCardProps {
  tool: AITool;
  onClick: () => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'analyzing':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'configuring':
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'training':
      return (
        <svg className="w-5 h-5 text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'trained':
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const getStatusConfig = (status: string) => {
  const configs = {
    analyzing: {
      label: 'Analyzing',
      badgeVariant: 'blue' as const,
      borderColor: 'border-blue-200',
    },
    configuring: {
      label: 'Action Required',
      badgeVariant: 'yellow' as const,
      borderColor: 'border-yellow-300',
    },
    training: {
      label: 'Training',
      badgeVariant: 'orange' as const,
      borderColor: 'border-orange-200',
    },
    trained: {
      label: 'Ready',
      badgeVariant: 'success' as const,
      borderColor: 'border-green-200',
    },
  };

  return configs[status as keyof typeof configs] || configs.analyzing;
};

export const AIToolCard = ({ tool, onClick }: AIToolCardProps) => {
  const statusConfig = getStatusConfig(tool.status);
  const isConfiguring = tool.status === 'configuring';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${
          isConfiguring ? `border-2 ${statusConfig.borderColor}` : ''
        }`}
        onClick={onClick}
      >
        <div className="space-y-4">
          {/* Header with Status Badge */}
          <div className="flex items-start justify-between">
            <Badge variant={statusConfig.badgeVariant} className="flex items-center gap-1.5">
              <StatusIcon status={tool.status} />
              {statusConfig.label}
            </Badge>
            {tool.active_version_number && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                v{tool.active_version_number}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {tool.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-sm text-gray-600">{tool.data_source_name}</p>
            </div>
          </div>

          {/* Status-specific content */}
          <div className="pt-3 border-t border-gray-100">
            {tool.status === 'analyzing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <Spinner size="sm" />
                <span>AI is analyzing your data...</span>
              </motion.div>
            )}

            {tool.status === 'configuring' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-gray-700">
                  Analysis complete! Configure your model to start training.
                </p>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="flex items-center group"
                >
                  <span>Configure Model</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </motion.div>
            )}

            {tool.status === 'training' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Training in progress</span>
                  <span className="text-gray-500">~3 min remaining</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600"
                    initial={{ width: '0%' }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['0%', '400%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            {tool.status === 'trained' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm text-gray-600">Versions</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{tool.version_count}</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="flex items-center group"
                >
                  <span>View Details</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(tool.created_at).toLocaleDateString()}</span>
            </div>
            <span className="capitalize font-medium text-primary-600">{tool.ai_model}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};