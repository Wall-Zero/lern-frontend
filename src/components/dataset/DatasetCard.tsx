import type { Dataset } from '../../types/dataset.types';

interface DatasetCardProps {
  dataset: Dataset;
  onClick: () => void;
  onAnalyze?: () => void;
}

export const DatasetCard = ({ dataset, onClick, onAnalyze }: DatasetCardProps) => {
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

  const statusColors = {
    connected: { bg: '#dcfce7', text: '#16a34a' },
    pending: { bg: '#fef3c7', text: '#d97706' },
    error: { bg: '#fee2e2', text: '#dc2626' },
  };

  const status = statusColors[dataset.status as keyof typeof statusColors] || { bg: '#f3f4f6', text: '#6b7280' };

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: '"Outfit", sans-serif'
      }}
      className="dataset-card"
    >
      <style>{`
        .dataset-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
          border-color: #0d9488;
        }
        .dataset-card:hover .view-link {
          opacity: 1;
        }
        .analyze-btn {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .analyze-btn:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <h3 style={{
            fontSize: '17px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 4px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>{dataset.name}</h3>
          {dataset.description && (
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>{dataset.description}</p>
          )}
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          background: status.bg,
          color: status.text,
          textTransform: 'capitalize',
          flexShrink: 0
        }}>
          {dataset.status === 'connected' ? 'Ready' : dataset.status}
        </span>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {[
          { label: 'Rows', value: dataset.row_count?.toLocaleString() || 'N/A' },
          { label: 'Columns', value: dataset.columns?.length || 0 },
          { label: 'Size', value: formatFileSize(dataset.file_size) },
          { label: 'Type', value: dataset.type?.toUpperCase() || 'N/A' },
        ].map((stat) => (
          <div key={stat.label}>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '0 0 2px 0'
            }}>{stat.label}</p>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#111827',
              margin: 0
            }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0
        }}>
          {formatDate(dataset.created_at)}
        </p>
        <span className="view-link" style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#0d9488',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          View
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      {/* Analyze Button */}
      {dataset.status === 'connected' && (
        <div style={{ marginTop: '16px' }}>
          <button
            className="analyze-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze?.();
            }}
          >
            Analyze Dataset →
          </button>
        </div>
      )}
    </div>
  );
};
