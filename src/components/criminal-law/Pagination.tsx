// src/components/criminal-law/Pagination.tsx

import { useCriminalLaw } from '../../context/CriminalLawContext';

export const Pagination = () => {
  const { state, setPage } = useCriminalLaw();
  const { page, totalPages } = state.pagination;

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {/* Previous */}
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          const isActive = pageNum === page;

          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum as number)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};