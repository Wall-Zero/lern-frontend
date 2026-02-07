import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomeIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const DataChartIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {direction === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    )}
  </svg>
);

type NavItem = {
  path: string;
  icon: React.FC;
  label: string;
  activeGradient?: string;
  activeHoverGradient?: string;
};

const navItems: NavItem[] = [
  { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  {
    path: '/data',
    icon: DataChartIcon,
    label: 'Data',
    activeGradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    activeHoverGradient: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
  },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  const width = collapsed ? '68px' : '260px';

  return (
    <div style={{
      width,
      minWidth: width,
      minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      fontFamily: '"Outfit", sans-serif',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .nav-link:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .nav-link.active {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          color: #fff;
        }
        .nav-link.active:hover {
          background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
        }
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          color: #6b7280;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          overflow: hidden;
        }
        .logout-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #111827;
        }
        .collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .collapse-btn:hover {
          background: #f3f4f6;
          color: #111827;
          border-color: #d1d5db;
        }
      `}</style>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '24px 16px' : '24px 20px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
      }}>
        <NavLink
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            cursor: 'pointer',
            minWidth: 0,
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700
            }}>L</span>
          </div>
          {!collapsed && (
            <span style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#111827'
            }}>LERN</span>
          )}
        </NavLink>
        {!collapsed && (
          <button className="collapse-btn" onClick={() => setCollapsed(true)} title="Collapse sidebar">
            <ChevronIcon direction="left" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <button className="collapse-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">
            <ChevronIcon direction="right" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: collapsed ? '8px' : '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              ...(isActive && item.activeGradient ? { background: item.activeGradient } : {}),
              ...(collapsed ? { justifyContent: 'center', padding: '12px', gap: '0' } : {}),
            })}
            title={collapsed ? item.label : undefined}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (el.classList.contains('active') && item.activeHoverGradient) {
                el.style.background = item.activeHoverGradient;
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (el.classList.contains('active') && item.activeGradient) {
                el.style.background = item.activeGradient;
              }
            }}
          >
            <item.icon />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{
        padding: collapsed ? '12px 8px' : '16px',
        borderTop: '1px solid #f3f4f6'
      }}>
        {collapsed ? (
          /* Collapsed: just avatar + logout icon */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="collapse-btn"
              title="Log out"
              style={{ color: '#6b7280' }}
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          /* Expanded: full user info */
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              padding: '8px',
              background: '#f9fafb',
              borderRadius: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{user?.username}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="logout-btn">
              <LogoutIcon />
              Log out
            </button>
          </>
        )}
      </div>
    </div>
  );
};
