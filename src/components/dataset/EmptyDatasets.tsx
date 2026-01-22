interface EmptyDatasetsProps {
  onUpload: () => void;
}

export const EmptyDatasets = ({ onUpload }: EmptyDatasetsProps) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 32px',
      fontFamily: '"Outfit", sans-serif'
    }}>
      <style>{`
        .empty-upload-btn {
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
          transition: all 0.2s ease;
        }
        .empty-upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
        }
      `}</style>

      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#f0fdfa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>

      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#111827',
        margin: '0 0 8px 0'
      }}>No datasets yet</h3>

      <p style={{
        fontSize: '15px',
        color: '#6b7280',
        margin: '0 0 32px 0',
        maxWidth: '400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.6
      }}>
        Upload your first dataset to start training ML models. We support CSV and Excel files.
      </p>

      <button className="empty-upload-btn" onClick={onUpload}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload Your First Dataset
      </button>
    </div>
  );
};
