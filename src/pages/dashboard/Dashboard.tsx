import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetsApi } from '../../api/endpoints/datasets';
import { generateStream } from '../../api/endpoints/aitools';
import { usePageTitle } from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import type { Dataset } from '../../types/dataset.types';

const DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt', 'md', 'text'];
const DATA_TYPES = ['csv', 'xlsx', 'xls', 'json', 'excel'];

const formatFileType = (type: string) => type.toUpperCase();

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

type Tab = 'legal' | 'data';
type ConversationStep = 'idle' | 'gemini_loading' | 'gemini_streaming' | 'gemini_done' | 'gpt_loading' | 'gpt_streaming' | 'gpt_done';
type MessageRole = 'user' | 'gemini' | 'gpt' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

const detectFutureDates = (text: string): string[] => {
  const patterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
    /\b(\d{1,2}-\d{1,2}-\d{4})\b/g,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
  ];

  const now = new Date();
  const found = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime()) && parsed > now) {
        found.add(match[1]);
      }
    }
  }

  return Array.from(found);
};

const legalSuggestions = [
  { label: 'Draft a Charter s.8 motion', icon: 'doc', tool: 'motion' },
  { label: 'Analyze a disclosure', icon: 'search', tool: 'analysis' },
  { label: 'Compare two contracts', icon: 'compare', tool: 'compare' },
  { label: 'Stay of proceedings brief', icon: 'doc', tool: 'motion' },
];

const dataSuggestions = [
  { label: 'Find patterns in my CSV', icon: 'chart' },
  { label: 'Detect data quality issues', icon: 'search' },
  { label: 'Correlate two datasets', icon: 'compare', tool: 'compare' },
  { label: 'ML readiness assessment', icon: 'chart' },
];

export const Dashboard = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('legal');
  const [direction, setDirection] = useState(0);
  const [intent, setIntent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentDocs, setRecentDocs] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Conversation state
  const [conversationStep, setConversationStep] = useState<ConversationStep>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState('');
  const [detectedDates, setDetectedDates] = useState<string[]>([]);
  const conversationRef = useRef<HTMLDivElement>(null);
  const feedbackInputRef = useRef<HTMLInputElement>(null);

  // Streaming state
  const [streamingText, setStreamingText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    setDirection(tab === 'data' ? 1 : -1);
    setActiveTab(tab);
    setIntent('');
    resetConversation();
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const response = await datasetsApi.list();
        const sorted = response.results
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 10);
        setRecentDocs(sorted);
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    };
    loadRecent();
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, conversationStep, streamingText]);

  // Focus feedback input when first response finishes
  useEffect(() => {
    if (conversationStep === 'gemini_done' || conversationStep === 'gpt_done') {
      setTimeout(() => feedbackInputRef.current?.focus(), 400);
    }
  }, [conversationStep]);

  const resetConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConversationStep('idle');
    setMessages([]);
    setFeedback('');
    setDetectedDates([]);
    setStreamingText('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = intent.trim();
    if (!query) return;

    setMessages([{ role: 'user', content: query }]);
    setConversationStep('gemini_loading');
    setIntent('');
    setStreamingText('');

    setTimeout(() => {
      setConversationStep('gemini_streaming');
      abortControllerRef.current = generateStream(
        { prompt: query, provider: 'gemini', max_tokens: 8000 },
        {
          onToken: (token) => setStreamingText((prev) => prev + token),
          onDone: (fullText) => {
            setMessages((prev) => [...prev, { role: 'gemini', content: fullText }]);
            setStreamingText('');
            setConversationStep('gemini_done');
            abortControllerRef.current = null;
          },
          onError: (error) => {
            toast.error(error || 'AI failed to respond.');
            resetConversation();
          },
        },
      );
    }, 300);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fb = feedback.trim();
    if (!fb) return;

    const userQuery = messages.find((m) => m.role === 'user')?.content || '';
    const aiMessages = messages.filter((m) => m.role === 'gpt' || m.role === 'gemini');
    const latestResponse = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : '';

    setMessages((prev) => [...prev, { role: 'user', content: fb }]);
    setFeedback('');
    setConversationStep('gpt_loading');
    setStreamingText('');

    const compoundPrompt = `The user originally asked: "${userQuery}"

The most recent AI response was:
"""
${latestResponse}
"""

The user then provided this feedback: "${fb}"

Please provide an improved, refined response that addresses the user's feedback while building on the previous answer. Be thorough, detailed, and specific.`;

    setTimeout(() => {
      setConversationStep('gpt_streaming');
      abortControllerRef.current = generateStream(
        { prompt: compoundPrompt, provider: 'gpt4', max_tokens: 8000 },
        {
          onToken: (token) => setStreamingText((prev) => prev + token),
          onDone: (fullText) => {
            setMessages((prev) => [...prev, { role: 'gpt', content: fullText }]);
            const dates = detectFutureDates(fullText);
            setDetectedDates(dates);
            setStreamingText('');
            setConversationStep('gpt_done');
            abortControllerRef.current = null;
          },
          onError: (error) => {
            setMessages((prev) => [...prev, { role: 'system', content: error || 'AI failed to respond.' }]);
            setStreamingText('');
            setConversationStep('gemini_done');
            abortControllerRef.current = null;
          },
        },
      );
    }, 300);
  };

  const startConversationFromSuggestion = (label: string) => {
    setMessages([{ role: 'user', content: label }]);
    setConversationStep('gemini_loading');
    setIntent('');
    setStreamingText('');

    setTimeout(() => {
      setConversationStep('gemini_streaming');
      abortControllerRef.current = generateStream(
        { prompt: label, provider: 'gemini', max_tokens: 8000 },
        {
          onToken: (token) => setStreamingText((prev) => prev + token),
          onDone: (fullText) => {
            setMessages((prev) => [...prev, { role: 'gemini', content: fullText }]);
            setStreamingText('');
            setConversationStep('gemini_done');
            abortControllerRef.current = null;
          },
          onError: (error) => {
            toast.error(error || 'AI failed to respond.');
            resetConversation();
          },
        },
      );
    }, 300);
  };

  const handleSuggestion = (label: string, tool?: string) => {
    if (tool) {
      const base = activeTab === 'legal' ? '/legal' : '/data';
      const params = new URLSearchParams();
      params.set('intent', label);
      params.set('tool', tool);
      navigate(`${base}?${params.toString()}`);
    } else {
      startConversationFromSuggestion(label);
    }
  };

  const legalTools = [
    {
      title: 'Draft Motions',
      description: 'Charter s.8, Disclosure, Stay of Proceedings with multi-model AI drafting.',
      link: '/legal?tool=motion',
      bullets: ['Charter s.8 & constitutional motions', 'Multi-model AI drafting', 'Case law integration'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Analyze Documents',
      description: 'Extract risks, obligations, and compliance gaps from contracts and disclosures.',
      link: '/legal?tool=analysis',
      bullets: ['Risk & obligation extraction', 'Compliance gap analysis', 'Multi-provider comparison'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: 'Compare & Research',
      description: 'Cross-reference documents to find patterns, contradictions, and enrichment.',
      link: '/legal?tool=compare',
      bullets: ['Cross-document pattern detection', 'Contradiction finder', 'Enrichment analysis'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  const dataTools = [
    {
      title: 'AI Data Insights',
      description: 'Upload CSV, Excel, JSON for AI-powered analysis, bias detection, and ML readiness.',
      link: '/data',
      bullets: ['Multi-provider analysis', 'Data quality & bias detection', 'ML readiness assessment'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Train Models',
      description: 'Build predictive models from datasets with one-click training and algorithm selection.',
      link: '/data',
      bullets: ['Automated feature engineering', 'Multiple algorithm options', 'Train/test configuration'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Enrich & Compare',
      description: 'Merge datasets, find correlations, and discover enrichment opportunities.',
      link: '/data?tool=compare',
      bullets: ['Cross-dataset correlation', 'Schema compatibility', 'FRED economic integration'],
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
  ];

  const tools = activeTab === 'legal' ? legalTools : dataTools;
  const suggestions = activeTab === 'legal' ? legalSuggestions : dataSuggestions;
  const accent = activeTab === 'legal' ? '#4b5563' : '#0d9488';
  const lightBg = activeTab === 'legal' ? '#f3f4f6' : '#f0fdfa';

  const filteredRecent = recentDocs.filter((doc) => {
    const fileType = doc.type?.toLowerCase() || '';
    if (activeTab === 'legal') return DOCUMENT_TYPES.includes(fileType);
    return DATA_TYPES.includes(fileType);
  }).slice(0, 4);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -280 : 280, opacity: 0 }),
  };

  const isConversationActive = conversationStep !== 'idle';
  const isAnyLoading = conversationStep === 'gemini_loading' || conversationStep === 'gpt_loading';
  const isStreaming = conversationStep === 'gemini_streaming' || conversationStep === 'gpt_streaming';

  return (
    <div style={{ minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .hero-section {
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(13, 148, 136, 0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(75, 85, 99, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .input-wrapper {
          position: relative;
          border-radius: 20px;
          padding: 2px;
          background: linear-gradient(135deg, #0d9488, #4b5563, #0d9488, #4b5563);
          background-size: 300% 300%;
          animation: gradient-rotate 6s ease infinite;
        }
        .input-wrapper.focused {
          box-shadow: 0 0 40px rgba(13, 148, 136, 0.15), 0 0 80px rgba(75, 85, 99, 0.06);
        }
        .input-inner {
          background: #fff;
          border-radius: 18px;
          display: flex;
          align-items: center;
          padding: 6px 6px 6px 20px;
          gap: 12px;
        }
        .hero-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #111827;
          padding: 14px 0;
          min-width: 0;
        }
        .hero-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .go-btn {
          border: none;
          border-radius: 14px;
          padding: 14px 28px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
        }
        .go-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(13, 148, 136, 0.35);
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 100px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          animation: float-in 0.4s ease backwards;
        }
        .chip:hover {
          border-color: #0d9488;
          color: #0d9488;
          background: #f0fdfa;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(13, 148, 136, 0.1);
        }

        .toggle-track {
          display: flex;
          padding: 4px;
          background: #f3f4f6;
          border-radius: 14px;
          position: relative;
          width: fit-content;
          margin: 0 auto;
        }
        .toggle-btn {
          position: relative;
          z-index: 1;
          padding: 10px 28px;
          border: none;
          background: transparent;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          transition: color 0.25s ease;
          color: #6b7280;
        }
        .toggle-btn.active { color: #fff; }
        .toggle-indicator {
          position: absolute;
          top: 4px;
          bottom: 4px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tool-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .tool-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0d9488, #4b5563);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .tool-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
          border-color: transparent;
        }
        .tool-card:hover::before {
          opacity: 1;
        }
        .tool-card .arrow-icon {
          transition: transform 0.2s ease;
        }
        .tool-card:hover .arrow-icon {
          transform: translateX(4px);
        }

        .recent-row {
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .recent-row:hover {
          background: #f9fafb;
        }

        .step-card {
          transition: all 0.2s ease;
        }
        .step-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        .progress-track {
          height: 3px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #0d9488, #2dd4bf, #0d9488);
          background-size: 200% 100%;
          animation: progress-shimmer 2s linear infinite;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feedback-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #111827;
          padding: 12px 0;
          min-width: 0;
        }
        .feedback-input::placeholder {
          color: #9ca3af;
        }

        .refine-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        }
        .refine-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35);
        }

        .date-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          border: 1px solid #fbbf24;
          background: #fffbeb;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #92400e;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .date-chip:hover {
          background: #fef3c7;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);
        }

        .new-query-btn {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          background: #fff;
          transition: all 0.2s ease;
        }
        .new-query-btn:hover {
          border-color: #0d9488;
          color: #0d9488;
          background: #f0fdfa;
        }

        .prose p { margin: 0 0 12px 0; }
        .prose p:last-child { margin-bottom: 0; }
        .prose h1, .prose h2, .prose h3, .prose h4 {
          font-weight: 700;
          color: #111827;
          margin: 20px 0 8px 0;
        }
        .prose h1 { font-size: 20px; }
        .prose h2 { font-size: 17px; }
        .prose h3 { font-size: 15px; }
        .prose h4 { font-size: 14px; }
        .prose h1:first-child, .prose h2:first-child, .prose h3:first-child { margin-top: 0; }
        .prose ul, .prose ol {
          margin: 8px 0 12px 0;
          padding-left: 20px;
        }
        .prose li { margin-bottom: 4px; }
        .prose strong { font-weight: 600; color: #111827; }
        .prose em { font-style: italic; }
        .prose code {
          font-size: 13px;
          background: #f3f4f6;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .prose pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 14px 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
          font-size: 13px;
        }
        .prose pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .prose blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 14px;
          margin: 12px 0;
          color: #6b7280;
          font-style: italic;
        }
        .prose hr {
          border: none;
          height: 1px;
          background: #e5e7eb;
          margin: 16px 0;
        }
        .prose a { color: #0d9488; text-decoration: underline; }

        @media (max-width: 900px) {
          .tools-grid { grid-template-columns: 1fr !important; }
          .chips-row { flex-wrap: wrap !important; }
        }
        @media (max-width: 640px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Hero Section — animates out when conversation starts ── */}
      <AnimatePresence>
        {!isConversationActive && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="hero-section" style={{
              padding: '40px 32px 36px',
              background: activeTab === 'legal'
                ? 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)'
                : 'linear-gradient(180deg, #f0fdfa 0%, #e6fffa 100%)',
              transition: 'background 0.3s ease',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                {/* Title */}
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em',
                }}>
                  What are you working on?
                </h1>
                <p style={{
                  fontSize: '15px',
                  color: '#64748b',
                  margin: '0 0 24px 0',
                }}>
                  Powered by <span style={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0d9488, #4b5563)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>LERN v1.2.1</span>
                </p>

                {/* Toggle */}
                <div style={{ marginBottom: '24px' }}>
                  <div className="toggle-track">
                    <motion.div
                      className="toggle-indicator"
                      animate={{
                        left: activeTab === 'legal' ? '4px' : '50%',
                        width: 'calc(50% - 4px)',
                      }}
                      style={{
                        background: activeTab === 'legal'
                          ? 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)'
                          : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                        boxShadow: activeTab === 'legal'
                          ? '0 2px 12px rgba(75, 85, 99, 0.35)'
                          : '0 2px 12px rgba(13, 148, 136, 0.35)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                    <button
                      className={`toggle-btn ${activeTab === 'legal' ? 'active' : ''}`}
                      onClick={() => switchTab('legal')}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Legal
                    </button>
                    <button
                      className={`toggle-btn ${activeTab === 'data' ? 'active' : ''}`}
                      onClick={() => switchTab('data')}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Data
                    </button>
                  </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit}>
                  <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
                    <div className="input-inner">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={activeTab}
                          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: accent, display: 'flex', flexShrink: 0 }}
                        >
                          {activeTab === 'legal' ? (
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                          ) : (
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                        </motion.span>
                      </AnimatePresence>
                      <input
                        ref={inputRef}
                        className="hero-input"
                        type="text"
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={
                          activeTab === 'legal'
                            ? 'Draft a motion, analyze a contract, compare disclosures...'
                            : 'Analyze sales data, find anomalies, train a model...'
                        }
                      />
                      <button type="submit" className="go-btn">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Suggestion Chips */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab + '-chips'}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="chips-row"
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '16px',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={s.label}
                        className="chip"
                        onClick={() => handleSuggestion(s.label, s.tool)}
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.5} style={{ opacity: 0.6 }}>
                          {s.icon === 'doc' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                          {s.icon === 'search' && <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                          {s.icon === 'compare' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}
                          {s.icon === 'chart' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                        </svg>
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conversation Flow ── */}
      <AnimatePresence>
        {isConversationActive && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div style={{
              display: 'flex',
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '48px 32px 24px',
              gap: '32px',
            }}>
            {/* Main conversation column */}
            <div
              ref={conversationRef}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* LERN header + user query */}
              {messages.length > 0 && messages[0].role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center', marginBottom: '8px' }}
                >
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    margin: '0 0 12px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: 'linear-gradient(135deg, #0d9488, #4b5563)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    LERN Assistant
                  </p>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.4,
                  }}>
                    {messages[0].content}
                  </h2>
                </motion.div>
              )}

              {/* Response messages (skip user[0] since it's the heading) */}
              {messages.slice(1).map((msg, i) => (
                <motion.div
                  key={`msg-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Separator */}
                  <div style={{
                    height: '1px',
                    background: '#e5e7eb',
                    margin: i === 0 ? '0 0 20px 0' : '20px 0',
                  }} />

                  {msg.role === 'user' && (
                    <>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#9ca3af',
                        margin: '0 0 6px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Your feedback
                      </p>
                      <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.6 }}>
                        {msg.content}
                      </p>
                    </>
                  )}

                  {msg.role === 'gpt' && (
                    <div style={{
                      background: '#f8f7ff',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6366f1',
                        margin: '0 0 10px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Refined
                      </p>
                      <div className="prose" style={{
                        fontSize: '14px',
                        color: '#1f2937',
                        lineHeight: 1.7,
                        wordBreak: 'break-word',
                      }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {(msg.role === 'gemini' || msg.role === 'system') && (
                    <div className="prose" style={{
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: 1.7,
                      wordBreak: 'break-word',
                    }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Brief loading indicator before streaming starts */}
              {isAnyLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ padding: '12px 0', textAlign: 'center' }}
                >
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: conversationStep === 'gpt_loading' ? '#f8f7ff' : '#f0fdfa',
                    border: `1px solid ${conversationStep === 'gpt_loading' ? '#e0e7ff' : '#ccfbf1'}`,
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: conversationStep === 'gpt_loading' ? '#6366f1' : '#0d9488',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: conversationStep === 'gpt_loading' ? '#6366f1' : '#0d9488',
                    }}>
                      {conversationStep === 'gemini_loading' ? 'Connecting...' : 'Connecting to GPT...'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Live streaming text */}
              {isStreaming && streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{
                    height: '1px',
                    background: '#e5e7eb',
                    margin: '0 0 20px 0',
                  }} />
                  <div style={conversationStep === 'gpt_streaming' ? {
                    background: '#f8f7ff',
                    borderRadius: '12px',
                    padding: '20px',
                  } : {}}>
                    {conversationStep === 'gpt_streaming' && (
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6366f1',
                        margin: '0 0 10px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Refining...
                      </p>
                    )}
                    <div className="prose" style={{
                      fontSize: '14px',
                      color: conversationStep === 'gpt_streaming' ? '#1f2937' : '#374151',
                      lineHeight: 1.7,
                      wordBreak: 'break-word',
                    }}>
                      <ReactMarkdown>{streamingText + '|'}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feedback input — shown after first response */}
              {(conversationStep === 'gemini_done' || conversationStep === 'gpt_done') && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: '0 0 8px 0',
                    fontWeight: 500,
                  }}>
                    Provide feedback to refine the response
                  </p>
                  <form onSubmit={handleFeedbackSubmit} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    padding: '6px 6px 6px 16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <input
                      ref={feedbackInputRef}
                      className="feedback-input"
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Make it more concise, add examples, focus on risks..."
                    />
                    <button type="submit" className="refine-btn" disabled={!feedback.trim()}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Refine
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </form>
                </motion.div>
              )}

              {/* New query button */}
              {(conversationStep === 'gpt_done' || isStreaming) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}
                >
                  <button className="new-query-btn" onClick={resetConversation}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      New query
                    </span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Side panel — future dates */}
            {conversationStep === 'gpt_done' && detectedDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                style={{
                  width: '240px',
                  flexShrink: 0,
                  position: 'sticky',
                  top: '48px',
                  alignSelf: 'flex-start',
                }}
              >
                <div style={{
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '20px',
                  background: '#fff',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0d9488, #4b5563)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      LERN Scheduler
                    </span>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: '0 0 14px 0',
                    lineHeight: 1.4,
                  }}>
                    Powered by LERN Personal Scheduler
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detectedDates.map((date) => (
                      <button
                        key={date}
                        className="date-chip"
                        onClick={() => toast.success(`Reminder set for ${date}`)}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content — fades out when conversation starts ── */}
      <AnimatePresence>
        {!isConversationActive && (
          <motion.div
            key="main-content"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          >
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Tools */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: activeTab === 'legal'
                    ? 'linear-gradient(135deg, #4b5563, #6b7280)'
                    : 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {activeTab === 'legal' ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  )}
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {activeTab === 'legal' ? 'Legal Tools' : 'Data Tools'}
                </h2>
              </div>
              <div className="tools-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}>
                {tools.map((tool) => (
                  <div
                    key={tool.title}
                    className="tool-card"
                    onClick={() => navigate(tool.link)}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: lightBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: accent,
                      marginBottom: '16px',
                    }}>
                      {tool.icon}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
                      {tool.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      {tool.description}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', flex: 1 }}>
                      {tool.bullets.map((b) => (
                        <li key={b} style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          padding: '3px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: accent,
                            opacity: 0.4,
                            flexShrink: 0,
                          }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <svg className="arrow-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Files */}
            {!isLoading && filteredRecent.length > 0 && (
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{
                  fontWeight: 600,
                  color: '#94a3b8',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '11px',
                }}>
                  Recent {activeTab === 'legal' ? 'Documents' : 'Datasets'}
                </h2>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}>
                  {filteredRecent.map((doc, i) => {
                    const isDoc = DOCUMENT_TYPES.includes(doc.type?.toLowerCase());
                    const rowAccent = isDoc ? '#4b5563' : '#0d9488';
                    const bgAccent = isDoc ? '#f3f4f6' : '#f0fdfa';
                    const targetRoute = isDoc ? '/legal' : '/data';
                    return (
                      <div
                        key={doc.id}
                        className="recent-row"
                        onClick={() => navigate(targetRoute)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: i < filteredRecent.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={rowAccent} strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {doc.name}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: rowAccent,
                            background: bgAccent,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}>
                            {formatFileType(doc.type)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {timeAgo(doc.updated_at)}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#0d9488',
                          }}>
                            Open
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div>
              <h2 style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                How It Works
              </h2>
              <div className="steps-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                {[
                  activeTab === 'legal'
                    ? { n: '1', t: 'Describe or Upload', d: 'Type what you need or drag in legal documents and PDFs.' }
                    : { n: '1', t: 'Describe or Upload', d: 'Type what you need or drag in CSVs, Excel, and JSON files.' },
                  { n: '2', t: 'AI Analyzes', d: 'Three AI models work in parallel to extract deep insights.' },
                  activeTab === 'legal'
                    ? { n: '3', t: 'Take Action', d: 'Get drafted motions, risk reports, and compliance analysis.' }
                    : { n: '3', t: 'Take Action', d: 'Get trained models, predictions, and enriched datasets.' },
                ].map((step) => (
                  <div key={step.n} className="step-card" style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '12px',
                    }}>
                      {step.n}
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>
                      {step.t}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                      {step.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0 8px',
          fontSize: '12px',
          color: '#94a3b8',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          Powered by <span style={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0d9488, #4b5563)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>LERN v1.2.1</span>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
