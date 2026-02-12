// src/components/criminal-law/SearchBar.tsx

import { useState, useEffect } from 'react';
import { useCriminalLaw } from '../../context/CriminalLawContext';

export const SearchBar = () => {
  const { state, searchArticles, fetchArticles, setSearchType } = useCriminalLaw();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        searchArticles(query.trim());
      } else if (query === '') {
        fetchArticles();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchArticles, fetchArticles]);

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search criminal law articles..."
            className="w-full px-4 py-2.5 pl-11 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search type toggle pills - TEAL */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Search type:</span>
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setSearchType('text')}
              className="px-3 py-1 text-xs font-medium rounded-md transition-all"
              style={
                state.searchType === 'text'
                  ? {
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                      color: '#fff',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }
                  : { color: '#6b7280' }
              }
            >
              Text
            </button>
            <button
              onClick={() => setSearchType('semantic')}
              className="px-3 py-1 text-xs font-medium rounded-md transition-all"
              style={
                state.searchType === 'semantic'
                  ? {
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                      color: '#fff',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }
                  : { color: '#6b7280' }
              }
            >
              Semantic
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {state.isLoading ? (
              'Searching...'
            ) : (
              `Showing ${state.pagination.totalCount.toLocaleString()} articles`
            )}
          </span>
        </div>
      </div>
    </div>
  );
};