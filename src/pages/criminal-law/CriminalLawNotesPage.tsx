// src/pages/criminal-law/CriminalLawNotesPage.tsx

import { useState, useEffect } from 'react';
import { CriminalLawProvider, useCriminalLaw } from '../../context/CriminalLawContext';
import { CriminalLawSidebar } from '../../components/criminal-law/CriminalLawSidebar';
import { SearchBar } from '../../components/criminal-law/SearchBar';
import { ArticleList } from '../../components/criminal-law/ArticleList';
import { ArticleDetailModal } from '../../components/criminal-law/ArticleDetailModal';

const CriminalLawNotesContent = () => {
  const { fetchArticles } = useCriminalLaw();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <CriminalLawSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CriminalLawSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Criminal Law Notes</h1>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Article List */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <ArticleList />
          </div>
        </div>
      </div>

      {/* Article Detail Modal */}
      <ArticleDetailModal />
    </div>
  );
};

export const CriminalLawNotesPage = () => {
  return (
    <CriminalLawProvider>
      <CriminalLawNotesContent />
    </CriminalLawProvider>
  );
};