import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

            .modal-input {
              width: 100%;
              padding: 12px 16px;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              transition: all 0.2s ease;
              outline: none;
            }
            .modal-input:focus {
              border-color: #0d9488;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .modal-input::placeholder {
              color: #9ca3af;
            }
            .modal-input.error {
              border-color: #ef4444;
            }
            .modal-textarea {
              width: 100%;
              padding: 12px 16px;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              transition: all 0.2s ease;
              outline: none;
              resize: vertical;
              min-height: 80px;
            }
            .modal-textarea:focus {
              border-color: #0d9488;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .modal-select {
              width: 100%;
              padding: 12px 16px;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              transition: all 0.2s ease;
              outline: none;
              cursor: pointer;
            }
            .modal-select:focus {
              border-color: #0d9488;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .upload-zone {
              border: 2px dashed #e5e7eb;
              border-radius: 12px;
              padding: 40px 24px;
              text-align: center;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .upload-zone:hover {
              border-color: #0d9488;
              background: #f0fdfa;
            }
            .upload-zone.has-file {
              border-color: #0d9488;
              background: #f0fdfa;
            }
            .cancel-btn {
              flex: 1;
              padding: 12px 20px;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 500;
              color: #6b7280;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .cancel-btn:hover {
              background: #f9fafb;
              border-color: #d1d5db;
            }
            .submit-btn {
              flex: 1;
              padding: 12px 20px;
              background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
              border: none;
              border-radius: 10px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 500;
              color: #fff;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .submit-btn:hover:not(:disabled) {
              box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
            }
            .submit-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: '"Outfit", sans-serif'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>Upload Dataset</h2>
              <button
                onClick={handleClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f3f4f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* File Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>File</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`upload-zone ${selectedFile ? 'has-file' : ''}`}
                >
                  {selectedFile ? (
                    <div>
                      <svg style={{ margin: '0 auto 12px' }} width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#111827',
                        margin: '0 0 4px 0'
                      }}>{selectedFile.name}</p>
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: 0
                      }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <svg style={{ margin: '0 auto 12px' }} width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p style={{
                        fontSize: '15px',
                        color: '#6b7280',
                        margin: '0 0 4px 0'
                      }}>Click to upload or drag and drop</p>
                      <p style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        margin: 0
                      }}>CSV, XLSX, XLS</p>
                    </div>
                  )}
                </label>
                {errors.file && (
                  <p style={{
                    fontSize: '13px',
                    color: '#ef4444',
                    margin: '8px 0 0 0'
                  }}>{errors.file.message}</p>
                )}
              </div>

              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>Dataset Name</label>
                <input
                  type="text"
                  placeholder="My Dataset"
                  className={`modal-input ${errors.name ? 'error' : ''}`}
                  {...register('name')}
                />
                {errors.name && (
                  <p style={{
                    fontSize: '13px',
                    color: '#ef4444',
                    margin: '8px 0 0 0'
                  }}>{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  placeholder="Describe your dataset..."
                  className="modal-textarea"
                  rows={3}
                  {...register('description')}
                />
              </div>

              {/* File Type */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px'
                }}>File Type</label>
                <select className="modal-select" {...register('type')}>
                  <option value="">Select type</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                  <option value="xls">XLS</option>
                </select>
                {errors.type && (
                  <p style={{
                    fontSize: '13px',
                    color: '#ef4444',
                    margin: '8px 0 0 0'
                  }}>{errors.type.message}</p>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Dataset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
