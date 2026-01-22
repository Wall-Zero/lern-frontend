import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetsApi, type DatasetPreview } from '../../api/endpoints/datasets';
import type { Dataset, DatasetColumn } from '../../types/dataset.types';
import { Spinner } from '../../components/common/Spinner';
import { UploadDatasetModal } from '../../components/dataset/UploadDatasetModal';
import { DataInsightsModal } from '../../components/dataset/DataInsightsModal';

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'created_at' | 'row_count' | 'file_size';
type SortOrder = 'asc' | 'desc';
type InterfaceMode = 'simple' | 'pro';

export const DatasetsList = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Interface mode (simple vs pro)
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>(() => {
    const saved = localStorage.getItem('datasets-interface-mode');
    return (saved as InterfaceMode) || 'simple';
  });

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Preview drawer state
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Column inspector state
  const [inspectingColumn, setInspectingColumn] = useState<{ dataset: Dataset; column: DatasetColumn } | null>(null);

  // Data insights modal state
  const [insightsDataset, setInsightsDataset] = useState<Dataset | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await datasetsApi.delete(id);
      await loadDatasets();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete dataset:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected datasets?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => datasetsApi.delete(id)));
      await loadDatasets();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete datasets:', error);
    }
  };

  // Store preview error for display
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreview = async (dataset: Dataset) => {
    setPreviewDataset(dataset);
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const data = await datasetsApi.preview(dataset.id);
      setPreviewData(data);
    } catch (error: any) {
      console.error('Failed to load preview:', error);
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.message
        || error.message
        || 'Unknown error';
      setPreviewError(errorMessage);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewDataset(null);
    setPreviewData(null);
    setPreviewError(null);
  };

  const toggleInterfaceMode = () => {
    const newMode = interfaceMode === 'simple' ? 'pro' : 'simple';
    setInterfaceMode(newMode);
    localStorage.setItem('datasets-interface-mode', newMode);
  };

  // Computed values
  const stats = useMemo(() => {
    const totalRows = datasets.reduce((sum, d) => sum + (d.row_count || 0), 0);
    const totalSize = datasets.reduce((sum, d) => sum + (d.file_size || 0), 0);
    const readyCount = datasets.filter(d => d.status === 'connected').length;
    return { totalRows, totalSize, readyCount, total: datasets.length };
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    let result = [...datasets];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(d => d.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'row_count':
          cmp = (a.row_count || 0) - (b.row_count || 0);
          break;
        case 'file_size':
          cmp = (a.file_size || 0) - (b.file_size || 0);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [datasets, searchQuery, typeFilter, statusFilter, sortField, sortOrder]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDatasets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDatasets.map(d => d.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .toolkit-page { font-family: 'Outfit', sans-serif; }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .stat-label {
          font-size: 13px;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Toolbar */
        .toolbar {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 8px 12px 8px 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .search-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        .filter-select {
          padding: 8px 32px 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          outline: none;
          font-family: 'Outfit', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .filter-select:focus {
          border-color: #0d9488;
        }
        .view-toggle {
          display: flex;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .view-btn {
          padding: 8px 12px;
          border: none;
          background: #fff;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
        }
        .view-btn:hover {
          background: #f3f4f6;
        }
        .view-btn.active {
          background: #0d9488;
          color: #fff;
        }
        .toolbar-btn {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .toolbar-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        .toolbar-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .toolbar-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .toolbar-btn.danger {
          color: #dc2626;
          border-color: #fecaca;
        }
        .toolbar-btn.danger:hover {
          background: #fef2f2;
        }

        /* Table */
        .data-table {
          width: 100%;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .data-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
        }
        .data-table th.sortable:hover {
          color: #0d9488;
        }
        .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #111827;
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        .data-table tr:hover td {
          background: #f9fafb;
        }
        .table-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #0d9488;
          cursor: pointer;
        }
        .table-name {
          font-weight: 500;
          color: #111827;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .table-name-desc {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 400;
        }
        .table-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.connected {
          background: #dcfce7;
          color: #16a34a;
        }
        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }
        .status-badge.error {
          background: #fee2e2;
          color: #dc2626;
        }
        .columns-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          max-width: 300px;
        }
        .column-tag {
          padding: 2px 8px;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 11px;
          color: #6b7280;
          font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          transition: all 0.15s;
        }
        .column-tag:hover {
          background: #e0f2fe;
          color: #0369a1;
        }
        .column-tag.more {
          background: #e5e7eb;
          color: #4b5563;
        }
        .action-btn {
          padding: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6b7280;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .action-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .action-btn.analyze:hover {
          background: #f0fdfa;
          color: #0d9488;
        }
        .action-btn.delete:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Grid View */
        .datasets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .datasets-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .datasets-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .grid-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .grid-card:hover {
          border-color: #0d9488;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .grid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .grid-card-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }
        .grid-card-desc {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .grid-card-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 16px 0;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .grid-stat-item {
          text-align: center;
        }
        .grid-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .grid-stat-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grid-card-columns {
          margin-top: 12px;
        }
        .grid-card-columns-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .grid-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }
        .grid-action-btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          color: #4b5563;
        }
        .grid-action-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .grid-action-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .grid-action-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }

        /* Preview Drawer */
        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 50;
        }
        .preview-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 800px;
          max-width: 90vw;
          background: #fff;
          z-index: 51;
          display: flex;
          flex-direction: column;
          box-shadow: -20px 0 40px rgba(0, 0, 0, 0.1);
        }
        .preview-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .preview-close {
          padding: 8px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
        }
        .preview-close:hover {
          background: #e5e7eb;
          color: #111827;
        }
        .preview-content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }
        .preview-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .preview-meta-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .preview-meta-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .preview-meta-value {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .preview-section {
          margin-bottom: 24px;
        }
        .preview-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .preview-columns-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .preview-column-card {
          padding: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .preview-column-card:hover {
          border-color: #0d9488;
          background: #f0fdfa;
        }
        .preview-column-name {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .preview-column-type {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .preview-column-badges {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .preview-column-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }
        .preview-column-badge.nullable {
          background: #fef3c7;
          color: #d97706;
        }
        .preview-column-badge.unique {
          background: #dbeafe;
          color: #2563eb;
        }
        .preview-data-table {
          width: 100%;
          overflow-x: auto;
        }
        .preview-data-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .preview-data-table th {
          text-align: left;
          padding: 10px 12px;
          background: #f3f4f6;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          font-family: 'JetBrains Mono', monospace;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .preview-data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'JetBrains Mono', monospace;
          color: #374151;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .preview-data-table tr:hover td {
          background: #f9fafb;
        }
        .preview-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
        }
        .preview-footer-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .preview-footer-btn.secondary {
          background: #fff;
          border: 1px solid #e5e7eb;
          color: #4b5563;
        }
        .preview-footer-btn.secondary:hover {
          background: #f9fafb;
        }
        .preview-footer-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .preview-footer-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }

        /* Column Inspector Modal */
        .column-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .column-modal {
          background: #fff;
          border-radius: 16px;
          width: 500px;
          max-width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .column-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .column-modal-content {
          padding: 24px;
          overflow-y: auto;
        }
        .column-info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .column-info-label {
          font-size: 14px;
          color: #6b7280;
        }
        .column-info-value {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .sample-values-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 20px 0 12px 0;
        }
        .sample-values-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sample-value {
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          color: #374151;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 32px;
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f0fdfa;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }
        .empty-desc {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 32px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        .empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
        }

        /* Mode Toggle */
        .mode-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          background: #f3f4f6;
          border-radius: 10px;
        }
        .mode-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mode-btn:hover {
          color: #374151;
        }
        .mode-btn.active {
          background: #fff;
          color: #0d9488;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Simple Mode Styles */
        .simple-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .simple-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }
        .simple-card:hover {
          border-color: #0d9488;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .simple-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .simple-card-icon.csv {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        }
        .simple-card-icon.xlsx, .simple-card-icon.xls {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        .simple-card-icon.default {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        .simple-card-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
        }
        .simple-card-desc {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .simple-card-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .simple-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }
        .simple-card-actions {
          display: flex;
          gap: 10px;
        }
        .simple-action-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .simple-action-btn.secondary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #374151;
        }
        .simple-action-btn.secondary:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        .simple-action-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .simple-action-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .simple-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Simple Header */
        .simple-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .simple-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px 0;
        }
        .simple-header p {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }
        .simple-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .simple-upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
        }

        /* Simple Empty State */
        .simple-empty {
          text-align: center;
          padding: 80px 32px;
          background: #fff;
          border: 2px dashed #e5e7eb;
          border-radius: 20px;
          max-width: 500px;
          margin: 0 auto;
        }
        .simple-empty-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .simple-empty h3 {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
        }
        .simple-empty p {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 28px 0;
          line-height: 1.6;
        }
      `}</style>

      <div className="toolkit-page">
        {/* Mode Toggle - Top Right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${interfaceMode === 'simple' ? 'active' : ''}`}
              onClick={() => interfaceMode !== 'simple' && toggleInterfaceMode()}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Simple
            </button>
            <button
              className={`mode-btn ${interfaceMode === 'pro' ? 'active' : ''}`}
              onClick={() => interfaceMode !== 'pro' && toggleInterfaceMode()}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Pro
            </button>
          </div>
        </div>

        {interfaceMode === 'simple' ? (
          /* ==================== SIMPLE MODE ==================== */
          <>
            <div className="simple-header">
              <h1>Your Datasets</h1>
              <p>Upload data files to train machine learning models</p>
              {datasets.length > 0 && (
                <button className="simple-upload-btn" onClick={() => setIsUploadModalOpen(true)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Dataset
                </button>
              )}
            </div>

            {datasets.length === 0 ? (
              <div className="simple-empty">
                <div className="simple-empty-icon">
                  <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3>Upload your first dataset</h3>
                <p>Drop a CSV or Excel file here to get started with machine learning</p>
                <button className="simple-upload-btn" onClick={() => setIsUploadModalOpen(true)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Dataset
                </button>
              </div>
            ) : (
              <div className="simple-grid">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="simple-card">
                    <div
                      className={`simple-card-icon ${dataset.type || 'default'}`}
                    >
                      {dataset.type === 'csv' ? (
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : dataset.type === 'xlsx' || dataset.type === 'xls' ? (
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6b7280">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>

                    <h3 className="simple-card-name">{dataset.name}</h3>
                    <p className="simple-card-desc">
                      {dataset.description || `${dataset.type?.toUpperCase()} file with ${dataset.row_count?.toLocaleString() || 0} rows`}
                    </p>

                    <div className="simple-card-meta">
                      <span className="simple-meta-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {dataset.row_count?.toLocaleString() || 0} rows
                      </span>
                      <span className="simple-meta-item">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        {dataset.columns?.length || 0} columns
                      </span>
                      <span className={`status-badge ${dataset.status}`} style={{ marginLeft: 'auto' }}>
                        {dataset.status === 'connected' ? 'Ready' : dataset.status}
                      </span>
                    </div>

                    <div className="simple-card-actions">
                      <button
                        className="simple-action-btn secondary"
                        onClick={() => handlePreview(dataset)}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </button>
                      <button
                        className="simple-action-btn secondary"
                        onClick={() => setInsightsDataset(dataset)}
                        disabled={dataset.status !== 'connected'}
                        title="AI-powered data analysis"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Insights
                      </button>
                      <button
                        className="simple-action-btn primary"
                        onClick={() => navigate(`/analysis?dataset=${dataset.id}`)}
                        disabled={dataset.status !== 'connected'}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Train Model
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ==================== PRO MODE ==================== */
          <>
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 8px 0'
              }}>Data Sources</h1>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                margin: 0
              }}>Upload, manage, and analyze your datasets for ML training</p>
            </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f0fdfa' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Datasets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="stat-value">{formatNumber(stats.totalRows)}</div>
              <div className="stat-label">Total Rows</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#d97706">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
              <div className="stat-label">Storage Used</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="stat-value">{stats.readyCount}</div>
              <div className="stat-label">Ready to Use</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="xls">XLS</option>
          </select>

          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="connected">Ready</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>

          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table View">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {selectedIds.size > 0 && (
            <button className="toolbar-btn danger" onClick={handleBulkDelete}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedIds.size})
            </button>
          )}

          <button className="toolbar-btn primary" onClick={() => setIsUploadModalOpen(true)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Dataset
          </button>
        </div>

        {/* Content */}
        {filteredDatasets.length === 0 && datasets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="empty-title">No datasets yet</h3>
            <p className="empty-desc">
              Upload your first dataset to start training ML models. We support CSV and Excel files.
            </p>
            <button className="empty-btn" onClick={() => setIsUploadModalOpen(true)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Your First Dataset
            </button>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p style={{ margin: 0, fontSize: '15px' }}>No datasets match your filters</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={selectedIds.size === filteredDatasets.length && filteredDatasets.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('name')}>
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Type</th>
                  <th className="sortable" onClick={() => toggleSort('row_count')}>
                    Rows {sortField === 'row_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Columns</th>
                  <th className="sortable" onClick={() => toggleSort('file_size')}>
                    Size {sortField === 'file_size' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th className="sortable" onClick={() => toggleSort('created_at')}>
                    Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((dataset) => (
                  <tr key={dataset.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={selectedIds.has(dataset.id)}
                        onChange={() => toggleSelect(dataset.id)}
                      />
                    </td>
                    <td>
                      <div className="table-name">
                        <span>{dataset.name}</span>
                        {dataset.description && (
                          <span className="table-name-desc">{dataset.description.slice(0, 50)}{dataset.description.length > 50 ? '...' : ''}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="table-mono" style={{ textTransform: 'uppercase' }}>{dataset.type}</span>
                    </td>
                    <td className="table-mono">{dataset.row_count?.toLocaleString() || '-'}</td>
                    <td>
                      <div className="columns-preview">
                        {dataset.columns?.slice(0, 3).map((col) => (
                          <span
                            key={col.name}
                            className="column-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingColumn({ dataset, column: col });
                            }}
                          >
                            {col.name}
                          </span>
                        ))}
                        {dataset.columns && dataset.columns.length > 3 && (
                          <span className="column-tag more">+{dataset.columns.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="table-mono">{formatFileSize(dataset.file_size)}</td>
                    <td>
                      <span className={`status-badge ${dataset.status}`}>
                        {dataset.status === 'connected' ? 'Ready' : dataset.status}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>{formatDate(dataset.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="action-btn" onClick={() => handlePreview(dataset)} title="Preview">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => setInsightsDataset(dataset)}
                          title="AI Insights"
                          disabled={dataset.status !== 'connected'}
                          style={{ color: dataset.status === 'connected' ? '#8b5cf6' : undefined }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn analyze"
                          onClick={() => navigate(`/analysis?dataset=${dataset.id}`)}
                          title="Analyze"
                          disabled={dataset.status !== 'connected'}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(dataset.id)} title="Delete">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="datasets-grid">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="grid-card"
                onClick={() => handlePreview(dataset)}
              >
                <div className="grid-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="grid-card-name">{dataset.name}</h3>
                    {dataset.description && <p className="grid-card-desc">{dataset.description}</p>}
                  </div>
                  <span className={`status-badge ${dataset.status}`}>
                    {dataset.status === 'connected' ? 'Ready' : dataset.status}
                  </span>
                </div>

                <div className="grid-card-stats">
                  <div className="grid-stat-item">
                    <div className="grid-stat-value">{formatNumber(dataset.row_count || 0)}</div>
                    <div className="grid-stat-label">Rows</div>
                  </div>
                  <div className="grid-stat-item">
                    <div className="grid-stat-value">{dataset.columns?.length || 0}</div>
                    <div className="grid-stat-label">Columns</div>
                  </div>
                  <div className="grid-stat-item">
                    <div className="grid-stat-value">{formatFileSize(dataset.file_size)}</div>
                    <div className="grid-stat-label">Size</div>
                  </div>
                </div>

                {dataset.columns && dataset.columns.length > 0 && (
                  <div className="grid-card-columns">
                    <div className="grid-card-columns-label">Columns</div>
                    <div className="columns-preview">
                      {dataset.columns.slice(0, 5).map((col) => (
                        <span
                          key={col.name}
                          className="column-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingColumn({ dataset, column: col });
                          }}
                        >
                          {col.name}
                        </span>
                      ))}
                      {dataset.columns.length > 5 && (
                        <span className="column-tag more">+{dataset.columns.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid-card-actions">
                  <button className="grid-action-btn" onClick={(e) => { e.stopPropagation(); handlePreview(dataset); }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </button>
                  <button
                    className="grid-action-btn"
                    onClick={(e) => { e.stopPropagation(); setInsightsDataset(dataset); }}
                    disabled={dataset.status !== 'connected'}
                    style={{ color: '#8b5cf6' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Insights
                  </button>
                  <button
                    className="grid-action-btn primary"
                    onClick={(e) => { e.stopPropagation(); navigate(`/analysis?dataset=${dataset.id}`); }}
                    disabled={dataset.status !== 'connected'}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Preview Drawer */}
      <AnimatePresence>
        {previewDataset && (
          <>
            <motion.div
              className="preview-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePreview}
            />
            <motion.div
              className="preview-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="preview-header">
                <h2 className="preview-title">{previewDataset.name}</h2>
                <button className="preview-close" onClick={closePreview}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="preview-content">
                {/* Meta Info */}
                <div className="preview-meta">
                  <div className="preview-meta-item">
                    <div className="preview-meta-label">Rows</div>
                    <div className="preview-meta-value">{previewDataset.row_count?.toLocaleString() || '-'}</div>
                  </div>
                  <div className="preview-meta-item">
                    <div className="preview-meta-label">Columns</div>
                    <div className="preview-meta-value">{previewDataset.columns?.length || 0}</div>
                  </div>
                  <div className="preview-meta-item">
                    <div className="preview-meta-label">Size</div>
                    <div className="preview-meta-value">{formatFileSize(previewDataset.file_size)}</div>
                  </div>
                  <div className="preview-meta-item">
                    <div className="preview-meta-label">Type</div>
                    <div className="preview-meta-value">{previewDataset.type?.toUpperCase()}</div>
                  </div>
                </div>

                {/* Column Schema */}
                {previewDataset.columns && previewDataset.columns.length > 0 && (
                  <div className="preview-section">
                    <h3 className="preview-section-title">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Column Schema
                    </h3>
                    <div className="preview-columns-grid">
                      {previewDataset.columns.map((col) => (
                        <div
                          key={col.name}
                          className="preview-column-card"
                          onClick={() => setInspectingColumn({ dataset: previewDataset, column: col })}
                        >
                          <div className="preview-column-name">{col.name}</div>
                          <div className="preview-column-type">{col.type}</div>
                          <div className="preview-column-badges">
                            {col.nullable && <span className="preview-column-badge nullable">Nullable</span>}
                            {col.unique && <span className="preview-column-badge unique">Unique</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Preview */}
                <div className="preview-section">
                  <h3 className="preview-section-title">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Data Preview
                  </h3>
                  {isLoadingPreview ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner size="md" />
                    </div>
                  ) : previewData ? (
                    <div className="preview-data-table">
                      <table>
                        <thead>
                          <tr>
                            {previewData.columns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.data.slice(0, 20).map((row, idx) => (
                            <tr key={idx}>
                              {previewData.columns.map((col) => (
                                <td key={col}>{String(row[col] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.data.length > 20 && (
                        <p style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '13px' }}>
                          Showing 20 of {previewData.total_rows.toLocaleString()} rows
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#dc2626', textAlign: 'center', padding: '20px', background: '#fef2f2', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Unable to load preview</p>
                      {previewError && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#991b1b', fontFamily: 'JetBrains Mono, monospace' }}>
                          {previewError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="preview-footer">
                <button className="preview-footer-btn secondary" onClick={closePreview}>
                  Close
                </button>
                <button
                  className="preview-footer-btn primary"
                  onClick={() => navigate(`/analysis?dataset=${previewDataset.id}`)}
                  disabled={previewDataset.status !== 'connected'}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze Dataset
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Column Inspector Modal */}
      <AnimatePresence>
        {inspectingColumn && (
          <motion.div
            className="column-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectingColumn(null)}
          >
            <motion.div
              className="column-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="column-modal-header">
                <h2 className="preview-title" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {inspectingColumn.column.name}
                </h2>
                <button className="preview-close" onClick={() => setInspectingColumn(null)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="column-modal-content">
                <div className="column-info-row">
                  <span className="column-info-label">Data Type</span>
                  <span className="column-info-value">{inspectingColumn.column.type}</span>
                </div>
                <div className="column-info-row">
                  <span className="column-info-label">Nullable</span>
                  <span className="column-info-value">{inspectingColumn.column.nullable ? 'Yes' : 'No'}</span>
                </div>
                <div className="column-info-row">
                  <span className="column-info-label">Unique Values</span>
                  <span className="column-info-value">{inspectingColumn.column.unique ? 'Yes' : 'No'}</span>
                </div>
                <div className="column-info-row">
                  <span className="column-info-label">From Dataset</span>
                  <span className="column-info-value">{inspectingColumn.dataset.name}</span>
                </div>

                {inspectingColumn.column.sample_values && inspectingColumn.column.sample_values.length > 0 && (
                  <>
                    <h4 className="sample-values-title">Sample Values</h4>
                    <div className="sample-values-list">
                      {inspectingColumn.column.sample_values.map((val, idx) => (
                        <span key={idx} className="sample-value">{val}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <DataInsightsModal
        isOpen={insightsDataset !== null}
        onClose={() => setInsightsDataset(null)}
        dataset={insightsDataset}
      />
    </div>
  );
};
