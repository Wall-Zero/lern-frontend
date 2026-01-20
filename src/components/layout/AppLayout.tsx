import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Toaster position="top-right" />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
};