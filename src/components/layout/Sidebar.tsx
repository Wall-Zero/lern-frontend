import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DatabaseIcon,
  ChartIcon,
  TargetIcon,
} from '../common/Icons';

const ShoppingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const HomeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const WorkspaceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const navItems = [
  { path: '/workspace', icon: WorkspaceIcon, label: 'Workspace' },
  { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { path: '/datasets', icon: DatabaseIcon, label: 'Datasets' },
  { path: '/analysis', icon: ChartIcon, label: 'Analysis' },
  { path: '/predictions', icon: TargetIcon, label: 'Predictions' },
  { path: '/marketplace', icon: ShoppingIcon, label: 'Marketplace' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col text-white sticky top-0 h-screen">
      {/* Logo - Fixed */}
      <div className="p-6 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
        <img 
          src="/logo_lern.jpg" 
          alt="LERN Logo" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <h1 className="text-2xl font-bold text-primary-400">LERN</h1>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section - Fixed at bottom */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0 bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};