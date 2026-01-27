import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Spinner } from '../common/Spinner';

export const DatasetSidebar = () => {
  const { state, selectDataset, uploadDataset, setStage } = useWorkspace();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadBtnHovered, setIsUploadBtnHovered] = useState(false);
  const [hoveredDatasetId, setHoveredDatasetId] = useState<string | null>(null);
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const name = file.name.replace(/\.[^/.]+$/, '');
    setIsUploading(true);
    try {
      await uploadDataset(file, name);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Datasets</h2>
      </div>

      {/* Upload dropzone */}
      <div
        className="mx-3 mt-3 p-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors"
        style={
          isDragOver
            ? { borderColor: '#0d9488', background: '#f0fdfa' }
            : isDropzoneHovered
              ? { borderColor: '#5eead4', background: '#f9fafb' }
              : { borderColor: '#d1d5db' }
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={() => setIsDropzoneHovered(true)}
        onMouseLeave={() => setIsDropzoneHovered(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />
        {isUploading ? (
          <Spinner />
        ) : (
          <>
            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-xs text-gray-500 mt-1">Drop file or click</p>
          </>
        )}
      </div>

      {/* Dataset list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence>
          {state.datasets.map((ds) => {
            const isActive = state.activeDataset?.id === ds.id;
            const isHovered = hoveredDatasetId === ds.id;
            return (
              <motion.button
                key={ds.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => selectDataset(ds.id)}
                onMouseEnter={() => setHoveredDatasetId(ds.id)}
                onMouseLeave={() => setHoveredDatasetId(null)}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={
                  isActive
                    ? { background: '#f0fdfa', border: '1px solid #99f6e4' }
                    : isHovered
                      ? { background: '#f9fafb', border: '1px solid transparent' }
                      : { border: '1px solid transparent' }
                }
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? '#0d9488' : '#9ca3af' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isActive ? '#0f766e' : '#111827' }}
                    >
                      {ds.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ds.row_count} rows &middot; {formatSize(ds.file_size)}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {state.datasets.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
            </svg>
            <p className="text-xs">No datasets yet</p>
          </div>
        )}
      </div>

      {/* Quick action */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setStage('upload')}
          onMouseEnter={() => setIsUploadBtnHovered(true)}
          onMouseLeave={() => setIsUploadBtnHovered(false)}
          className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors"
          style={{
            color: '#0d9488',
            background: isUploadBtnHovered ? '#ccfbf1' : '#f0fdfa',
          }}
        >
          + Upload new dataset
        </button>
      </div>
    </div>
  );
};
