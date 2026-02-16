// src/components/criminal-law/MessageList.tsx

import React, { useEffect, useRef } from 'react';
import { useChatContext } from '../../context/ChatContext';
import ReactMarkdown from 'react-markdown';

export const MessageList: React.FC = () => {
  const { messages } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-2xl">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 
                        flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Criminal Law Research Assistant
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Ask me anything about Canadian criminal law. I'll search through legal documents,
            statutes, and provide detailed answers with citations.
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm max-w-lg mx-auto">
            <div className="p-4 bg-white rounded-xl text-left shadow-sm border border-gray-200 
                          hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer group">
              <span className="text-gray-500 group-hover:text-cyan-600 transition-colors">Try:</span>{' '}
              <span className="text-gray-800 font-medium">"What are the conditions for bail?"</span>
            </div>
            <div className="p-4 bg-white rounded-xl text-left shadow-sm border border-gray-200 
                          hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer group">
              <span className="text-gray-500 group-hover:text-cyan-600 transition-colors">Or:</span>{' '}
              <span className="text-gray-800 font-medium">"Explain the reasonable doubt standard"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: any }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            ${isUser
              ? 'bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-cyan-600/20'
              : 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
            } px-5 py-4
          `}
        >
          {/* CAMBIO AQUÍ: Usar ReactMarkdown para formatear */}
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
            {message.content ? (
              <ReactMarkdown
                components={{
                  // Links de citations
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-cyan-600 hover:text-cyan-700 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  // Strong (negritas)
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="font-bold text-gray-900" />
                  ),
                  // Lists
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc list-inside space-y-1 my-2" />
                  ),
                  li: ({ node, ...props }) => (
                    <li {...props} className="ml-2" />
                  ),
                  // Párrafos
                  p: ({ node, ...props }) => (
                    <p {...props} className="mb-2 leading-relaxed" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <span className="text-gray-400 italic flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating response...
              </span>
            )}
          </div>

          {message.isStreaming && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
              </div>
              <span>Streaming...</span>
            </div>
          )}

          {!isUser && message.sources_metadata  && !message.isStreaming && (
            <MetadataSection metadata={message.sources_metadata} />
          )}

          <div className={`mt-3 text-xs ${isUser ? 'text-cyan-100' : 'text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};


const MetadataSection: React.FC<{ metadata: any }> = ({ metadata }) => {
  return (
    <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">

    { /* Primary Source */}
      {metadata.primary_source && (
        <PrimarySourceCard source={metadata.primary_source} />
      )}

      {/* Supporting Sources */}
      {metadata.supporting_sources && metadata.supporting_sources.length > 0 && (
        <SupportingSourcesSection sources={metadata.supporting_sources} />
      )}

      {/* Citations */}
      {metadata.citations && metadata.citations.length > 0 && (
        <CitationsSection citations={metadata.citations} />
      )}

      {/* Key Sections */}
      {metadata.key_sections && metadata.key_sections.length > 0 && (
        <KeySectionsSection sections={metadata.key_sections} />
      )}

      {/* Suggested Followups */}
      {metadata.suggested_followups && metadata.suggested_followups.length > 0 && (
        <FollowupsSection followups={metadata.suggested_followups} />
      )}

      {/* Stats */}
      {metadata.metadata?.stats && (
        <StatsSection stats={metadata.metadata.stats} />
      )}
    </div>
  );
};

const ConfidenceBadge: React.FC<{ confidence: number; breakdown?: any }> = ({ confidence, breakdown }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'High', icon: '✓' };
    if (score >= 0.6) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Medium', icon: '⚠' };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Low', icon: '!' };
  };

  const colors = getConfidenceColor(confidence);

  return (
    <div className={`p-3 ${colors.bg} border ${colors.border} rounded-lg`}>

      
      {breakdown?.explanation && (
        <p className="text-xs text-gray-600 mb-2">{breakdown.explanation}</p>
      )}

      {breakdown?.factors && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(breakdown.factors).slice(0, 4).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1">
              <span className="text-gray-600 capitalize text-[10px]">{key.replace(/_/g, ' ')}</span>
              <span className={`font-semibold ${colors.text}`}>{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const PrimarySourceCard: React.FC<{ source: any }> = ({ source }) => {
  return (
    <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-gray-900">Primary Source</h4>
            {source.relevance_score && (
              <span className="text-xs font-semibold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                {(source.relevance_score * 100).toFixed(0)}% match
              </span>
            )}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:underline mt-1 block"
          >
            {source.title}
          </a>
          {source.section && (
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
              § {source.section}
            </span>
          )}

        </div>
      </div>
    </div>
  );
};
const SupportingSourcesSection: React.FC<{ sources: any[] }> = ({ sources }) => {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Supporting Sources ({sources.length})
      </h4>
      <div className="space-y-2">
        {sources.slice(0, 5).map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 hover:bg-cyan-50 border border-gray-200 
                     hover:border-cyan-300 rounded-lg transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 group-hover:text-cyan-700 mb-1">
                  {source.title}
                </div>
                {source.section && (
                  <span className="inline-block text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                    § {source.section}
                  </span>
                )}
              </div>
              {source.relevance_score && (
                <span className="text-xs text-gray-500 flex-shrink-0 font-semibold">
                  {(source.relevance_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const CitationsSection: React.FC<{ citations: any[] }> = ({ citations }) => {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Citations ({citations.length})
      </h4>
      <div className="space-y-1.5">
        {citations.map((citation, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs bg-white/60 rounded px-2 py-1.5">
            <span className="text-blue-600 font-mono font-bold flex-shrink-0">[{idx + 1}]</span>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-800 hover:underline flex-1"
            >
              <span className="font-semibold">Article #{citation.article_id}</span>: {citation.title}
              {citation.section && <span className="font-mono ml-1">§ {citation.section}</span>}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

const KeySectionsSection: React.FC<{ sections: string[] }> = ({ sections }) => {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Relevant Sections
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((section, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-cyan-100 hover:to-teal-100
                     text-gray-800 hover:text-cyan-900 rounded text-xs font-mono font-semibold
                     border border-gray-300 hover:border-cyan-400 cursor-pointer transition-all shadow-sm"
          >
            {section}
          </span>
        ))}
      </div>
    </div>
  );
};

const FollowupsSection: React.FC<{ followups: string[] }> = ({ followups }) => {
  const { sendMessage } = useChatContext();

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
         Suggested Follow-ups
      </h4>
      <div className="flex flex-wrap gap-2">
        {followups.map((followup, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(followup)}
            className="px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 
                     text-cyan-700 hover:text-cyan-800 text-xs rounded-lg 
                     border border-cyan-200 hover:border-cyan-400 transition-all 
                     hover:shadow-md font-medium"
          >
            {followup}
          </button>
        ))}
      </div>
    </div>
  );
};

const StatsSection: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="text-xs text-gray-500 flex items-center flex-wrap gap-3 pt-3 border-t border-gray-200">
      {stats.final_results && (
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {stats.final_results} sources
        </span>
      )}
      {stats.tokens_generated && (
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {stats.tokens_generated} tokens
        </span>
      )}
      {stats.reranker_used !== undefined && (
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
          {stats.reranker_used ? '✓ Reranked' : '○ No rerank'}
        </span>
      )}
    </div>
  );
};