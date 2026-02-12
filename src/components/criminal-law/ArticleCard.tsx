// src/components/criminal-law/ArticleCard.tsx

import { StatusBadge } from './StatusBadge';
import type { Article } from '../../types/criminalLaw.types';

interface ArticleCardProps {
  article: Article;
  onViewDetails: (id: number) => void;
}

export const ArticleCard = ({ article, onViewDetails }: ArticleCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-[400px]">
      {/* Header with title and badge */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
            {article.title}
          </h3>
          <StatusBadge status={article.status} size="sm" />
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm mb-3">
          {article.volume && (
            <span className="flex items-center gap-1.5 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate max-w-[150px]">{article.volume}</span>
            </span>
          )}
          {article.section && (
            <span className="text-gray-500 truncate">
              § {article.section}
            </span>
          )}
          {article.criminal_code_section && (
            <span className="px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full">
              CC {article.criminal_code_section}
            </span>
          )}
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {article.case_count} cases
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {article.word_count.toLocaleString()} words
          </span>
        </div>
      </div>

      {/* Preview text - scrollable */}
      <div className="px-6 flex-1 overflow-hidden">
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
          {article.content_preview}
        </p>
      </div>

      {/* Tags */}
      <div className="px-6 pb-4 flex-shrink-0">
        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.categories.slice(0, 4).map((category, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded truncate max-w-[120px]"
              >
                {category}
              </span>
            ))}
            {article.categories.length > 4 && (
              <span className="px-2 py-0.5 text-xs text-gray-400">
                +{article.categories.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer button con gradiente teal - fixed at bottom */}
      <div className="px-6 py-4 flex-shrink-0">
        <button
          onClick={() => onViewDetails(article.id)}
          className="w-full py-2.5 text-white font-semibold text-sm rounded-lg transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
};