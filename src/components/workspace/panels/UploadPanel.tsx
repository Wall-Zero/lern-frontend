import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

export const UploadPanel = () => {
  const { uploadDataset } = useWorkspace();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !name) return;
    setIsUploading(true);
    try {
      await uploadDataset(selectedFile, name, description);
      setSelectedFile(null);
      setName('');
      setDescription('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '32px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .upload-panel { font-family: 'Outfit', sans-serif; }

        .upload-dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 48px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fff;
        }
        .upload-dropzone:hover {
          border-color: #0d9488;
          background: #f9fafb;
        }
        .upload-dropzone.drag-over {
          border-color: #0d9488;
          background: #f0fdfa;
        }
        .upload-dropzone.has-file {
          border-color: #0d9488;
          background: #f0fdfa;
          border-style: solid;
        }

        .upload-change-file {
          font-size: 12px;
          color: #0d9488;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          transition: color 0.15s;
        }
        .upload-change-file:hover {
          color: #0f766e;
        }

        .upload-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.15s;
          resize: vertical;
          box-sizing: border-box;
        }
        .upload-textarea:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
      `}</style>

      <div className="upload-panel">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 8px 0',
            fontFamily: "'Outfit', sans-serif"
          }}>Upload Your Data</h1>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '15px',
            fontFamily: "'Outfit', sans-serif"
          }}>Upload a CSV, Excel, or JSON file to get started</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Drag and drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`upload-dropzone${isDragOver ? ' drag-over' : ''}${selectedFile ? ' has-file' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {selectedFile ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <svg style={{ margin: '0 auto 12px', display: 'block' }} height="48" width="48" fill="none" stroke="#0d9488" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  margin: '0 0 4px 0',
                  fontFamily: "'Outfit', sans-serif"
                }}>{selectedFile.name}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setName(''); }}
                  className="upload-change-file"
                >
                  Change file
                </button>
              </motion.div>
            ) : (
              <div>
                <svg style={{ margin: '0 auto 12px', display: 'block' }} height="48" width="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 4px 0',
                  fontFamily: "'Outfit', sans-serif"
                }}>Drag and drop your file here</p>
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  margin: 0,
                  fontFamily: "'Outfit', sans-serif"
                }}>or click to browse. CSV, XLSX, XLS, JSON supported</p>
              </div>
            )}
          </div>

          {/* Name & Description */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Input
                label="Dataset Name"
                placeholder="My Dataset"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                  fontFamily: "'Outfit', sans-serif"
                }}>Description (Optional)</label>
                <textarea
                  placeholder="Describe your dataset..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="upload-textarea"
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isUploading}>
                Upload Dataset
              </Button>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};
