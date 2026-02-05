import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StageHeader } from '../../components/workspace/StageHeader';
import { DatasetSidebar } from '../../components/workspace/DatasetSidebar';
import { WorkspaceContent } from '../../components/workspace/WorkspaceContent';
import { MarketplacePanel } from '../../components/workspace/MarketplacePanel';
import { usePageTitle } from '../../hooks/usePageTitle';

export const WorkspaceInner = () => {
  usePageTitle('Workspace');
  const { uploadDataset, setStage, selectDataset, state } = useWorkspace();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when dataset is selected on mobile
  useEffect(() => {
    if (isMobile && state.activeDataset) {
      setIsMobileSidebarOpen(false);
    }
  }, [state.activeDataset, isMobile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Don't show full-page overlay for dataset drags from sidebar
    if (e.dataTransfer.types.includes('application/x-dataset-id')) return;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Don't handle dataset drags at this level — let the UploadPanel handle them
    const datasetId = e.dataTransfer.getData('application/x-dataset-id');
    if (datasetId) {
      selectDataset(Number(datasetId));
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      const name = file.name.replace(/\.[^/.]+$/, '');
      await uploadDataset(file, name);
      setStage('upload');
    }
  }, [uploadDataset, setStage, selectDataset]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        height: '100vh',
        background: '#f9fafb',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(13, 148, 136, 0.08)',
            border: '3px dashed #0d9488',
            borderRadius: '12px',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <svg style={{ margin: '0 auto 12px', display: 'block' }} height="48" width="48" fill="none" stroke="#0d9488" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#0d9488', margin: 0 }}>
              Drop file to upload
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              CSV, XLSX, XLS, JSON
            </p>
          </div>
        </div>
      )}

      {/* Mobile overlay when sidebar is open */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isMobileSidebarOpen ? 0 : '-100%') : 0,
          top: 0,
          bottom: 0,
          zIndex: isMobile ? 50 : 'auto',
          transition: 'left 0.3s ease',
          width: isMobile ? '85%' : 'auto',
          maxWidth: isMobile ? '320px' : 'none',
        }}
      >
        <DatasetSidebar onClose={isMobile ? () => setIsMobileSidebarOpen(false) : undefined} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
        }}
      >
        <StageHeader
          onMenuClick={isMobile ? () => setIsMobileSidebarOpen(true) : undefined}
          showMenuButton={isMobile}
        />
        <WorkspaceContent />
      </div>
      {!isMobile && <MarketplacePanel />}
    </div>
  );
};
