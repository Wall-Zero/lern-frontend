import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

export const AppLayout = ({ children, hideSidebar }: AppLayoutProps) => {
  return (
    <>
      <Toaster position="top-right" />
      <div className="flex min-h-screen w-full" style={{ background: '#f9fafb' }}>
        {!hideSidebar && <Sidebar />}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </>
  );
};
