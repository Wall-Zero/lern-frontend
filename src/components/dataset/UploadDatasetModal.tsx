import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['csv', 'xlsx', 'xls']),
  file: z.instanceof(File, { message: 'File is required' }),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: UploadFormData) => Promise<void>;
}

export const UploadDatasetModal = ({ isOpen, onClose, onUpload }: UploadDatasetModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        setValue('type', extension as 'csv' | 'xlsx' | 'xls');
      }

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setValue('name', nameWithoutExt);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    setIsUploading(true);
    try {
      await onUpload(data);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Dataset</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-200">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <AnimatePresence mode="wait">
                        {selectedFile ? (
                          <motion.div
                            key="file-selected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <svg className="mx-auto h-12 w-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="no-file"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-600 mb-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">CSV, XLSX, XLS</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </label>
                  </div>
                  {errors.file && (
                    <p className="mt-2 text-sm text-red-600">{errors.file.message}</p>
                  )}
                </div>

                <Input
                  label="Dataset Name"
                  placeholder="My Dataset"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Describe your dataset..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    {...register('description')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    File Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    {...register('type')}
                  >
                    <option value="">Select type</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="xls">XLS</option>
                  </select>
                  {errors.type && (
                    <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isUploading}
                  >
                    Upload Dataset
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};