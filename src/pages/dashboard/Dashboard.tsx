import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/endpoints/dashboard';
import { Spinner } from '../../components/common/Spinner';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { DashboardStats } from '../../api/endpoints/dashboard';

export const Dashboard = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData] = await Promise.all([dashboardApi.getStats()]);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasDatasets = (stats?.total_datasets ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Upload Dataset',
      description: 'Import your CSV or Excel data to start training models',
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      action: () => navigate('/datasets'),
      primary: !hasDatasets
    },
    {
      title: 'Train a Model',
      description: 'Create AI models from your datasets with one click',
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => navigate('/analysis'),
      primary: hasDatasets
    },
    {
      title: 'Make Predictions',
      description: 'Use your trained models to predict new outcomes',
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: () => navigate('/predictions'),
      primary: false
    },
    {
      title: 'Browse Marketplace',
      description: 'Discover pre-built models and datasets from the community',
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      action: () => navigate('/marketplace'),
      primary: false
    },
  ];

  const resources = [
    { title: 'Getting Started Guide', description: 'Learn the basics in 5 minutes', icon: '📖' },
    { title: 'Video Tutorials', description: 'Step-by-step walkthroughs', icon: '🎬' },
    { title: 'API Documentation', description: 'Integrate LERN into your apps', icon: '🔧' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .action-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }
        .action-card:hover .action-icon {
          transform: scale(1.1);
        }
        .action-icon {
          transition: transform 0.2s ease;
        }
        .resource-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .resource-card:hover {
          background: #f8fafc;
        }
        .stat-pill {
          transition: all 0.2s ease;
        }
        .stat-pill:hover {
          transform: scale(1.02);
        }

        @media (max-width: 1024px) {
          .actions-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .actions-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '28px',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          {hasDatasets ? 'Welcome back!' : 'Get Started'}
        </h1>
        <p style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          {hasDatasets
            ? 'Continue where you left off or start something new'
            : 'Upload your first dataset to begin building ML models'
          }
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-row" style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Datasets', value: stats?.total_datasets ?? 0, path: '/datasets' },
          { label: 'Models', value: stats?.trained_models ?? 0, path: '/analysis' },
          { label: 'Predictions', value: stats?.total_predictions ?? 0, path: '/predictions' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-pill"
            onClick={() => navigate(stat.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer'
            }}
          >
            <span style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827'
            }}>{stat.value}</span>
            <span style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '14px',
              color: '#6b7280'
            }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 16px 0'
        }}>Quick Actions</h2>

        <div className="actions-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          {quickActions.map((action, i) => (
            <div
              key={i}
              className="action-card"
              onClick={action.action}
              style={{
                background: action.primary ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#fff',
                borderRadius: '16px',
                padding: '24px',
                border: action.primary ? 'none' : '1px solid #e5e7eb',
                boxShadow: action.primary ? '0 4px 20px rgba(13, 148, 136, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div className="action-icon" style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: action.primary ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: action.primary ? '#fff' : '#0d9488',
                marginBottom: '16px'
              }}>
                {action.icon}
              </div>
              <h3 style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: action.primary ? '#fff' : '#111827',
                margin: '0 0 8px 0'
              }}>{action.title}</h3>
              <p style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '14px',
                color: action.primary ? 'rgba(255,255,255,0.8)' : '#6b7280',
                margin: 0,
                lineHeight: 1.5
              }}>{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* How it Works */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 20px 0'
          }}>How it Works</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { step: '1', title: 'Upload your data', desc: 'CSV or Excel files with your historical data' },
              { step: '2', title: 'Train a model', desc: 'Our AI analyzes patterns automatically' },
              { step: '3', title: 'Get predictions', desc: 'Use your model on new data instantly' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0d9488',
                  flexShrink: 0
                }}>{item.step}</div>
                <div>
                  <p style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#111827',
                    margin: '0 0 2px 0'
                  }}>{item.title}</p>
                  <p style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 20px 0'
          }}>Resources</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resources.map((resource, i) => (
              <div
                key={i}
                className="resource-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{resource.icon}</span>
                <div>
                  <p style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#111827',
                    margin: '0 0 2px 0'
                  }}>{resource.title}</p>
                  <p style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0
                  }}>{resource.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
