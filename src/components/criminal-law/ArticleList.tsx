// src/components/criminal-law/ArticleList.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { useCriminalLaw } from '../../context/CriminalLawContext';
import { ArticleCard } from './ArticleCard';
import { Pagination } from './Pagination';

export const ArticleList = () => {
  const { state, fetchArticle } = useCriminalLaw();

  const handleViewDetails = (id: number) => {
    fetchArticle(id);
  };

  // Error state
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">Failed to load articles</p>
        <p className="text-sm text-gray-600">{state.error}</p>
      </div>
    );
  }

  // Empty state (only if NOT loading)
  if (state.articles.length === 0 && !state.isLoadingList) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">No articles found</p>
        <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Results count - solo cuando NO está loading */}
      {!state.isLoadingList && state.articles.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {state.articles.length} of {state.pagination.totalCount.toLocaleString()} articles
          </p>
        </div>
      )}

      {/* Loading state - spinner centrado limpio */}
      {state.isLoadingList ? (
        <div className="flex flex-col items-center justify-center h-96">
          <svg 
            className="animate-spin h-12 w-12 text-teal-600 mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 font-medium">Loading articles...</p>
        </div>
      ) : (
        <>
          {/* Grid - solo cuando NO está loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {state.articles.map((article) => (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArticleCard article={article} onViewDetails={handleViewDetails} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <Pagination />
        </>
      )}
    </div>
  );
};