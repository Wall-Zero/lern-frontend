// src/components/criminal-law/ArticleDetailModal.tsx

import { useState } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from './StatusBadge';
import { Spinner } from '../common/Spinner';
import { useCriminalLaw } from '../../context/CriminalLawContext';

export const ArticleDetailModal = () => {
  const { state, closeArticle } = useCriminalLaw();
  const [activeTab, setActiveTab] = useState<'content' | 'chunks' | 'cases'>('content');
  
  const article = state.selectedArticle;
  const isOpen = !!article;

  if (!article) return null;

  return (
    <Modal isOpen={isOpen} onClose={closeArticle} title={article.title}>
      {/* Header Info */}
      <div className="flex items-start gap-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={article.status} size="md" />
            {article.criminal_code_section && (
              <span className="px-2.5 py-1 text-sm bg-primary-50 text-primary-700 rounded-full font-medium">
                CC {article.criminal_code_section}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {article.volume && (
              <div>
                <p className="text-gray-500">Volume</p>
                <p className="font-medium text-gray-900">{article.volume}</p>
              </div>
            )}
            {article.section && (
              <div>
                <p className="text-gray-500">Section</p>
                <p className="font-medium text-gray-900">{article.section}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Word Count</p>
              <p className="font-medium text-gray-900">{article.word_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Cases Referenced</p>
              <p className="font-medium text-gray-900">{article.case_references.length}</p>
            </div>
          </div>
        </div>

        {/* External Link */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <span>View on Page</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'content'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Full Content
        </button>
        <button
          onClick={() => setActiveTab('chunks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chunks'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Chunks ({article.chunks.length})
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cases'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Case References ({article.case_references.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Full Content Tab */}
        {activeTab === 'content' && (
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-gray-700 leading-relaxed space-y-4"
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {article.content.split('\n').map((paragraph, idx) => {
                // Skip empty lines
                if (!paragraph.trim()) return null;
                
                // Detect section headers (all caps or short lines ending with colon)
                const isHeader = paragraph === paragraph.toUpperCase() && paragraph.length < 100;
                const isSubheader = paragraph.trim().endsWith(':') && paragraph.length < 80;
                
                if (isHeader) {
                  return (
                    <h3 key={idx} className="text-base font-bold text-gray-900 mt-6 mb-3">
                      {paragraph}
                    </h3>
                  );
                }
                
                if (isSubheader) {
                  return (
                    <h4 key={idx} className="text-sm font-semibold text-gray-800 mt-4 mb-2">
                      {paragraph}
                    </h4>
                  );
                }
                
                // Detect lists (lines starting with numbers, bullets, or dashes)
                const isList = /^[\d\-\•\*]/.test(paragraph.trim());
                
                if (isList) {
                  return (
                    <li key={idx} className="text-sm text-gray-700 ml-4 mb-1">
                      {paragraph.trim()}
                    </li>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Chunks Tab */}
        {activeTab === 'chunks' && (
          <div className="space-y-3">
            {article.chunks.map((chunk) => (
              <details
                key={chunk.id}
                className="group border border-gray-200 rounded-lg overflow-hidden"
              >
                <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      Chunk {chunk.chunk_number + 1} of {chunk.total_chunks}
                    </span>
                    <span className="text-xs text-gray-500">
                      {chunk.word_count} words
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 transform transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed bg-white">
                  {chunk.chunk_text}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div className="space-y-2">
            {article.case_references.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No case references found</p>
            ) : (
              article.case_references.map((caseRef) => (
                <a
                  key={caseRef.id}
                  href={caseRef.case_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                        {caseRef.case_name || 'Unnamed Case'}
                      </p>
                      {caseRef.case_year && (
                        <p className="text-sm text-gray-600 mt-1">{caseRef.case_year}</p>
                      )}
                      {caseRef.context && (
                        <p className="text-sm text-gray-600 mt-2">{caseRef.context}</p>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Categories Footer */}
      {article.categories && article.categories.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {article.categories.map((category, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};