import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetsApi } from '../../api/endpoints/datasets';
import { generateStream, motionIntake } from '../../api/endpoints/aitools';
import apiClient from '../../api/client';
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

// Motion types
type MotionProvider = 'claude' | 'gemini' | 'gpt4';
type MotionWorkflow = 'parallel' | 'refine';

interface MotionMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MotionResult {
  success: boolean;
  provider?: string;
  motion_type?: string;
  motion?: {
    header?: string;
    title?: string;
    introduction?: string;
    relief_sought?: string[];
    grounds?: string[];
    factual_background?: string;
    legal_argument?: {
      charter_violation?: string;
      grant_analysis?: {
        seriousness_of_breach?: string;
        impact_on_accused?: string;
        society_interest?: string;
      };
      case_law?: string[];
    };
    conclusion?: string;
    signature_block?: string;
  };
  supporting_arguments?: string[];
  potential_crown_responses?: string[];
  key_case_law?: Array<{ case: string; relevance: string }>;
  evidence_to_gather?: string[];
  risk_assessment?: { strength?: string; explanation?: string };
  raw_motion?: string;
  refinement_notes?: string;
  improvements_made?: string[];
}

const MOTION_KEYWORDS = ['motion', 'draft', 'charter', 's.8', 's.24', 'exclusion',
  'disclosure', 'stay of proceedings', 'factum', 'brief'];
const isMotionIntent = (text: string) =>
  MOTION_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

const MOTION_TYPES = [
  { id: 'charter_s8', label: 'Charter s.8 - Illegal Search & Seizure' },
  { id: 'disclosure', label: 'Disclosure Application' },
  { id: 'stay_of_proceedings', label: 'Stay of Proceedings' },
];

const PROVIDER_INFO: Record<string, { name: string; color: string; bg: string }> = {
  claude: { name: 'Claude', color: '#D97706', bg: '#FEF3C7' },
  gemini: { name: 'Gemini', color: '#2563EB', bg: '#DBEAFE' },
  gpt4: { name: 'GPT-5.2', color: '#10B981', bg: '#D1FAE5' },
};

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

  // Motion mode state
  const [motionMode, setMotionMode] = useState(false);
  const [motionConversation, setMotionConversation] = useState<MotionMessage[]>([]);
  const [motionInput, setMotionInput] = useState('');
  const [motionLoading, setMotionLoading] = useState(false);
  const [motionType, setMotionType] = useState('charter_s8');
  const [motionWorkflow, setMotionWorkflow] = useState<MotionWorkflow>('refine');
  const [creatorProvider, setCreatorProvider] = useState<MotionProvider>('gemini');
  const [refinerProvider, setRefinerProvider] = useState<MotionProvider>('claude');
  const [motionGenerating, setMotionGenerating] = useState(false);
  const [motionGenStep, setMotionGenStep] = useState<'idle' | 'creating' | 'refining' | 'done'>('idle');
  const [motionProgress, setMotionProgress] = useState(0);
  const [motionResult, setMotionResult] = useState<MotionResult | null>(null);
  const [motionRefineResult, setMotionRefineResult] = useState<{ initial: MotionResult; refined: MotionResult } | null>(null);
  const [motionActiveTab, setMotionActiveTab] = useState<string>('refined');
  const motionInputRef = useRef<HTMLInputElement>(null);
  const motionEndRef = useRef<HTMLDivElement>(null);
  // Motion sidebar state
  const [motionDocs, setMotionDocs] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [motionSelectedDocs, setMotionSelectedDocs] = useState<number[]>([]);
  const [canLIIQuery, setCanLIIQuery] = useState('');
  const [showAddToCase, setShowAddToCase] = useState(false);
  const [caseOrPersonName, setCaseOrPersonName] = useState('');
  const [addToCaseSaved, setAddToCaseSaved] = useState(false);
  const motionFileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll motion conversation
  useEffect(() => {
    if (motionEndRef.current) {
      motionEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [motionConversation, motionLoading, motionResult]);

  // Focus motion input when loading finishes
  useEffect(() => {
    if (motionMode && !motionLoading && !motionGenerating) {
      setTimeout(() => motionInputRef.current?.focus(), 300);
    }
  }, [motionMode, motionLoading, motionGenerating]);

  // Load docs for motion sidebar
  useEffect(() => {
    if (motionMode && motionDocs.length === 0) {
      datasetsApi.list().then(res => {
        setMotionDocs((res.results || []).map((ds: { id: number; name: string; type?: string }) => ({
          id: ds.id, name: ds.name, type: ds.type || 'file',
        })));
      }).catch(() => {});
    }
  }, [motionMode, motionDocs.length]);

  const enterMotionMode = (initialMessage: string) => {
    setMotionMode(true);
    setMotionConversation([{ role: 'user', content: initialMessage }]);
    setMotionLoading(true);
    setMotionResult(null);
    setMotionRefineResult(null);
    setMotionGenStep('idle');
    // Detect motion type from message
    const lower = initialMessage.toLowerCase();
    if (lower.includes('disclosure')) setMotionType('disclosure');
    else if (lower.includes('stay')) setMotionType('stay_of_proceedings');
    else setMotionType('charter_s8');

    // Call intake
    motionIntake({
      conversation: [{ role: 'user', content: initialMessage }],
      motion_type: lower.includes('disclosure') ? 'disclosure' : lower.includes('stay') ? 'stay_of_proceedings' : 'charter_s8',
      provider: 'gemini',
    }).then(res => {
      if (res.ready) {
        handleMotionReady(res, [{ role: 'user', content: initialMessage }]);
      } else {
        setMotionConversation(prev => [...prev, { role: 'assistant', content: res.question }]);
      }
    }).catch(err => {
      toast.error('Failed to start motion intake');
      console.error(err);
    }).finally(() => setMotionLoading(false));
  };

  const handleMotionMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = motionInput.trim();
    if (!msg || motionLoading) return;

    const updatedConv = [...motionConversation, { role: 'user' as const, content: msg }];
    setMotionConversation(updatedConv);
    setMotionInput('');
    setMotionLoading(true);

    try {
      const res = await motionIntake({
        conversation: updatedConv,
        motion_type: motionType,
        provider: 'gemini',
      });

      if (res.ready) {
        handleMotionReady(res, updatedConv);
      } else {
        setMotionConversation(prev => [...prev, { role: 'assistant', content: res.question }]);
      }
    } catch (err) {
      toast.error('Failed to process response');
      console.error(err);
    } finally {
      setMotionLoading(false);
    }
  };

  const handleMotionReady = async (
    intakeResult: { case_details: Record<string, string>; case_description: string; motion_type: string },
    conv: MotionMessage[],
  ) => {
    // Show confirmation message in chat
    setMotionConversation([...conv, {
      role: 'assistant',
      content: `Got it. I have everything I need. Generating your ${MOTION_TYPES.find(m => m.id === intakeResult.motion_type)?.label || 'motion'} now...`,
    }]);

    setMotionGenerating(true);
    setMotionGenStep('creating');
    setMotionProgress(0);

    const progressInterval = setInterval(() => {
      setMotionProgress(prev => prev >= 90 ? 90 : prev + Math.random() * 3 + 0.5);
    }, 500);

    try {
      if (motionWorkflow === 'refine') {
        // Step 1: Generate with creator
        const createRes = await apiClient.post('/ai-tools/generate_motion/', {
          motion_type: intakeResult.motion_type,
          case_details: intakeResult.case_details,
          case_description: intakeResult.case_description,
          reference_document_ids: motionSelectedDocs,
          providers: [creatorProvider],
        });
        const initialDraft = createRes.data.results?.[creatorProvider];
        if (!initialDraft?.success) throw new Error('Draft generation failed');

        setMotionProgress(100);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Refine
        setMotionGenStep('refining');
        setMotionProgress(0);

        const refineRes = await apiClient.post('/ai-tools/refine_draft/', {
          motion_type: intakeResult.motion_type,
          case_details: intakeResult.case_details,
          case_description: intakeResult.case_description,
          original_motion: initialDraft,
          refiner_provider: refinerProvider,
        });

        if (refineRes.data.success) {
          setMotionRefineResult({ initial: initialDraft, refined: refineRes.data.refined_result });
          setMotionActiveTab('refined');
        } else {
          setMotionRefineResult({ initial: initialDraft, refined: initialDraft });
          setMotionActiveTab('initial');
        }
      } else {
        // Parallel
        const res = await apiClient.post('/ai-tools/generate_motion/', {
          motion_type: intakeResult.motion_type,
          case_details: intakeResult.case_details,
          case_description: intakeResult.case_description,
          reference_document_ids: motionSelectedDocs,
          providers: [creatorProvider],
        });
        const result = res.data.results?.[creatorProvider];
        if (result?.success) {
          setMotionResult(result);
        }
      }

      setMotionProgress(100);
      setMotionGenStep('done');
    } catch (err) {
      toast.error('Motion generation failed');
      console.error(err);
      setMotionGenStep('idle');
    } finally {
      clearInterval(progressInterval);
      setMotionGenerating(false);
    }
  };

  const resetMotionMode = () => {
    setMotionMode(false);
    setMotionConversation([]);
    setMotionInput('');
    setMotionResult(null);
    setMotionRefineResult(null);
    setMotionGenStep('idle');
    setMotionProgress(0);
    setMotionGenerating(false);
    setMotionLoading(false);
    setMotionSelectedDocs([]);
    setShowAddToCase(false);
    setAddToCaseSaved(false);
  };

  const getFullMotionText = (result: MotionResult | undefined) => {
    if (!result?.motion) return result?.raw_motion || '';
    const m = result.motion;
    return `${m.header || ''}\n\n${m.title || ''}\n\n${m.introduction || ''}\n\nRELIEF SOUGHT:\n${(m.relief_sought || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nGROUNDS:\n${(m.grounds || []).map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\nFACTUAL BACKGROUND:\n${m.factual_background || ''}\n\nLEGAL ARGUMENT:\n${m.legal_argument?.charter_violation || ''}\n\n${m.conclusion || ''}\n\n${m.signature_block || ''}`;
  };

  const handleDownloadMotion = (result: MotionResult | undefined) => {
    const text = getFullMotionText(result);
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Motion - ${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openCanLII = (query?: string) => {
    const q = query || canLIIQuery;
    if (q) window.open(`https://www.canlii.org/en/#search/type=decision&text=${encodeURIComponent(q)}`, '_blank');
    else window.open('https://www.canlii.org/en/on/', '_blank');
  };

  const handleMotionFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const typeMap: Record<string, string> = {
          pdf: 'pdf', doc: 'doc', docx: 'docx', txt: 'txt', md: 'md',
          csv: 'csv', xlsx: 'excel', xls: 'excel', json: 'json',
        };
        await datasetsApi.create({ name: file.name, type: typeMap[ext] || ext, file });
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
    }
    // Refresh docs
    try {
      const res = await datasetsApi.list();
      setMotionDocs((res.results || []).map((ds: { id: number; name: string; type?: string }) => ({
        id: ds.id, name: ds.name, type: ds.type || 'file',
      })));
    } catch {}
    if (motionFileInputRef.current) motionFileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = intent.trim();
    if (!query) return;

    // Check for motion intent
    if (activeTab === 'legal' && isMotionIntent(query)) {
      setIntent('');
      enterMotionMode(query);
      return;
    }

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
    if (tool === 'motion') {
      // Enter motion mode directly on the dashboard
      enterMotionMode(label);
      return;
    }
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

  const isConversationActive = conversationStep !== 'idle' || motionMode;
  const isRegularConversation = conversationStep !== 'idle' && !motionMode;
  const isAnyLoading = conversationStep === 'gemini_loading' || conversationStep === 'gpt_loading';
  const isStreaming = conversationStep === 'gemini_streaming' || conversationStep === 'gpt_streaming';

  // Get the active motion result for display
  const activeMotionResult = motionRefineResult
    ? (motionActiveTab === 'initial' ? motionRefineResult.initial : motionRefineResult.refined)
    : motionResult;

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

      {/* ── Motion Conversation Mode ── */}
      <AnimatePresence>
        {motionMode && (
          <motion.div
            key="motion-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 24px', gap: '24px' }}>
              {/* Main conversation column */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Motion header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'linear-gradient(135deg, #7c3aed, #4b5563)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Motion Drafter
                  </p>
                </motion.div>

                {/* Chat messages */}
                {motionConversation.map((msg, i) => (
                  <motion.div
                    key={`motion-msg-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #4b5563, #374151)' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#374151',
                      border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      boxShadow: msg.role === 'user' ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {motionLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[0, 1, 2].map(j => (
                          <div key={j} style={{
                            width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af',
                            animation: `pulse 1s ease-in-out ${j * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>Thinking...</span>
                    </div>
                  </motion.div>
                )}

                {/* Generation progress stepper */}
                {motionGenerating && motionGenStep !== 'done' && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px', margin: '0 auto' }}>
                      {[
                        { key: 'creating', label: `Creating draft with ${PROVIDER_INFO[creatorProvider].name}`, provider: creatorProvider },
                        ...(motionWorkflow === 'refine' ? [{ key: 'refining', label: `Refining with ${PROVIDER_INFO[refinerProvider].name}`, provider: refinerProvider }] : []),
                      ].map((step, idx) => {
                        const isActive = step.key === motionGenStep;
                        const isComplete = (step.key === 'creating' && motionGenStep === 'refining');
                        const providerColor = PROVIDER_INFO[step.provider]?.color || '#6b7280';
                        return (
                          <div key={step.key}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '13px', flexShrink: 0,
                                background: isComplete ? '#16a34a' : isActive ? providerColor : '#e5e7eb',
                                color: isComplete || isActive ? '#fff' : '#9ca3af',
                                boxShadow: isActive ? `0 0 0 4px ${providerColor}25` : 'none',
                              }}>
                                {isComplete ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : idx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{step.label}</div>
                              </div>
                              {isActive && (
                                <div style={{ width: '18px', height: '18px', border: `2.5px solid ${providerColor}30`, borderTopColor: providerColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                              )}
                            </div>
                            {isActive && (
                              <div style={{ marginTop: '8px', marginLeft: '48px', height: '3px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(motionProgress, 95)}%`, background: providerColor, borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </motion.div>
                )}

                {/* Generated motion result inline */}
                {motionGenStep === 'done' && activeMotionResult && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    {/* Workflow tabs for refine mode */}
                    {motionRefineResult && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', padding: '3px', background: '#f3f4f6', borderRadius: '10px' }}>
                        {[
                          { key: 'initial', label: `Initial (${PROVIDER_INFO[creatorProvider].name})`, provider: creatorProvider },
                          { key: 'refined', label: `Refined (${PROVIDER_INFO[refinerProvider].name})`, provider: refinerProvider },
                        ].map(tab => (
                          <button key={tab.key} onClick={() => setMotionActiveTab(tab.key)} style={{
                            flex: 1, padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                            background: motionActiveTab === tab.key ? '#fff' : 'transparent',
                            color: motionActiveTab === tab.key ? PROVIDER_INFO[tab.provider].color : '#6b7280',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            boxShadow: motionActiveTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PROVIDER_INFO[tab.provider].color, display: 'inline-block', marginRight: '6px' }} />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Refinement notes */}
                    {motionActiveTab === 'refined' && motionRefineResult?.refined?.refinement_notes && (
                      <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '14px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Refinement Notes</div>
                        <p style={{ fontSize: '13px', color: '#15803d', margin: 0, lineHeight: 1.5 }}>{motionRefineResult.refined.refinement_notes}</p>
                      </div>
                    )}

                    {/* Risk assessment */}
                    {activeMotionResult.risk_assessment && (
                      <div style={{
                        padding: '14px 16px', borderRadius: '10px', marginBottom: '14px',
                        background: activeMotionResult.risk_assessment.strength === 'strong' ? '#f0fdf4' : activeMotionResult.risk_assessment.strength === 'moderate' ? '#fffbeb' : '#fef2f2',
                        borderLeft: `4px solid ${activeMotionResult.risk_assessment.strength === 'strong' ? '#16a34a' : activeMotionResult.risk_assessment.strength === 'moderate' ? '#d97706' : '#dc2626'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Motion Strength:</span>
                          <span style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                            background: activeMotionResult.risk_assessment.strength === 'strong' ? '#dcfce7' : activeMotionResult.risk_assessment.strength === 'moderate' ? '#fef3c7' : '#fecaca',
                            color: activeMotionResult.risk_assessment.strength === 'strong' ? '#166534' : activeMotionResult.risk_assessment.strength === 'moderate' ? '#92400e' : '#dc2626',
                          }}>{activeMotionResult.risk_assessment.strength}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>{activeMotionResult.risk_assessment.explanation}</p>
                      </div>
                    )}

                    {/* Motion sections */}
                    {activeMotionResult.motion ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeMotionResult.motion.header && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>{activeMotionResult.motion.header}</pre>
                          </div>
                        )}
                        {(activeMotionResult.motion.title || activeMotionResult.motion.introduction) && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            {activeMotionResult.motion.title && <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 10px 0', textAlign: 'center' }}>{activeMotionResult.motion.title}</h3>}
                            {activeMotionResult.motion.introduction && <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{activeMotionResult.motion.introduction}</p>}
                          </div>
                        )}
                        {activeMotionResult.motion.relief_sought && activeMotionResult.motion.relief_sought.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>RELIEF SOUGHT</h4>
                            <ol style={{ margin: 0, paddingLeft: '20px' }}>
                              {activeMotionResult.motion.relief_sought.map((item, i) => <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '6px' }}>{item}</li>)}
                            </ol>
                          </div>
                        )}
                        {activeMotionResult.motion.grounds && activeMotionResult.motion.grounds.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>GROUNDS</h4>
                            <ol style={{ margin: 0, paddingLeft: '20px' }}>
                              {activeMotionResult.motion.grounds.map((item, i) => <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '6px' }}>{item}</li>)}
                            </ol>
                          </div>
                        )}
                        {activeMotionResult.motion.factual_background && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>FACTUAL BACKGROUND</h4>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{activeMotionResult.motion.factual_background}</p>
                          </div>
                        )}
                        {activeMotionResult.motion.legal_argument && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>LEGAL ARGUMENT</h4>
                            {activeMotionResult.motion.legal_argument.charter_violation && (
                              <div style={{ marginBottom: '12px' }}>
                                <h5 style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', margin: '0 0 6px 0' }}>Charter Violation</h5>
                                <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{activeMotionResult.motion.legal_argument.charter_violation}</p>
                              </div>
                            )}
                            {activeMotionResult.motion.legal_argument.grant_analysis && (
                              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', marginTop: '8px' }}>
                                <h5 style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>Grant Framework Analysis</h5>
                                {activeMotionResult.motion.legal_argument.grant_analysis.seriousness_of_breach && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>1. Seriousness of Breach:</span>
                                    <p style={{ fontSize: '12px', color: '#374151', margin: '2px 0 0 0', lineHeight: 1.5 }}>{activeMotionResult.motion.legal_argument.grant_analysis.seriousness_of_breach}</p>
                                  </div>
                                )}
                                {activeMotionResult.motion.legal_argument.grant_analysis.impact_on_accused && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>2. Impact on Accused:</span>
                                    <p style={{ fontSize: '12px', color: '#374151', margin: '2px 0 0 0', lineHeight: 1.5 }}>{activeMotionResult.motion.legal_argument.grant_analysis.impact_on_accused}</p>
                                  </div>
                                )}
                                {activeMotionResult.motion.legal_argument.grant_analysis.society_interest && (
                                  <div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>3. Society's Interest:</span>
                                    <p style={{ fontSize: '12px', color: '#374151', margin: '2px 0 0 0', lineHeight: 1.5 }}>{activeMotionResult.motion.legal_argument.grant_analysis.society_interest}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {activeMotionResult.motion.conclusion && (
                          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>CONCLUSION</h4>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{activeMotionResult.motion.conclusion}</p>
                          </div>
                        )}
                      </div>
                    ) : activeMotionResult.raw_motion && (
                      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' }}>
                        <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>{activeMotionResult.raw_motion}</pre>
                      </div>
                    )}

                    {/* Key case law */}
                    {activeMotionResult.key_case_law && activeMotionResult.key_case_law.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginTop: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 10px 0' }}>Key Case Law</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeMotionResult.key_case_law.map((c, i) => (
                            <div key={i} style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ fontWeight: 600, fontSize: '12px', color: '#7c3aed' }}>{c.case}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{c.relevance}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New query button */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                      <button className="new-query-btn" onClick={resetMotionMode}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          New query
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Chat input - only show during intake phase */}
                {!motionGenerating && motionGenStep !== 'done' && !motionLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <form onSubmit={handleMotionMessage} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb',
                      padding: '6px 6px 6px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <input
                        ref={motionInputRef}
                        className="feedback-input"
                        type="text"
                        value={motionInput}
                        onChange={(e) => setMotionInput(e.target.value)}
                        placeholder="Type your response..."
                      />
                      <button type="submit" className="refine-btn" disabled={!motionInput.trim()} style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Send
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </span>
                      </button>
                    </form>
                  </motion.div>
                )}

                <div ref={motionEndRef} />
              </div>

              {/* ── Right Sidebar ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '24px', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {/* Workflow section */}
                <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Workflow</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', padding: '3px', background: '#f3f4f6', borderRadius: '8px' }}>
                    <button onClick={() => setMotionWorkflow('parallel')} style={{
                      flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 600,
                      background: motionWorkflow === 'parallel' ? '#fff' : 'transparent',
                      color: motionWorkflow === 'parallel' ? '#111827' : '#9ca3af',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      boxShadow: motionWorkflow === 'parallel' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}>Compare</button>
                    <button onClick={() => setMotionWorkflow('refine')} style={{
                      flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 600,
                      background: motionWorkflow === 'refine' ? '#fff' : 'transparent',
                      color: motionWorkflow === 'refine' ? '#111827' : '#9ca3af',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      boxShadow: motionWorkflow === 'refine' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}>Create & Refine</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
                        {motionWorkflow === 'refine' ? 'Creator' : 'Provider'}
                      </label>
                      <select value={creatorProvider} onChange={(e) => setCreatorProvider(e.target.value as MotionProvider)} style={{
                        width: '100%', padding: '7px 10px', border: `1.5px solid ${PROVIDER_INFO[creatorProvider].color}40`,
                        borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: PROVIDER_INFO[creatorProvider].bg, cursor: 'pointer',
                      }}>
                        <option value="claude">Claude</option>
                        <option value="gemini">Gemini</option>
                        <option value="gpt4">GPT-5.2</option>
                      </select>
                    </div>
                    {motionWorkflow === 'refine' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>Refiner</label>
                        <select value={refinerProvider} onChange={(e) => setRefinerProvider(e.target.value as MotionProvider)} style={{
                          width: '100%', padding: '7px 10px', border: `1.5px solid ${PROVIDER_INFO[refinerProvider].color}40`,
                          borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: PROVIDER_INFO[refinerProvider].bg, cursor: 'pointer',
                        }}>
                          <option value="claude">Claude</option>
                          <option value="gemini">Gemini</option>
                          <option value="gpt4">GPT-5.2</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents section */}
                <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Documents</div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#7c3aed'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#d1d5db'; handleMotionFileUpload(e.dataTransfer.files); }}
                    onClick={() => motionFileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #d1d5db', borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer',
                      marginBottom: '10px', background: '#fafafa', transition: 'border-color 0.2s',
                    }}
                  >
                    <input ref={motionFileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" style={{ display: 'none' }} onChange={(e) => handleMotionFileUpload(e.target.files)} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ margin: '0 auto 4px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Drop files or <span style={{ color: '#7c3aed', fontWeight: 600 }}>browse</span></div>
                  </div>
                  {motionDocs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                      {motionDocs.map(doc => {
                        const sel = motionSelectedDocs.includes(doc.id);
                        return (
                          <button key={doc.id} onClick={() => setMotionSelectedDocs(prev => sel ? prev.filter(id => id !== doc.id) : [...prev, doc.id])} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: sel ? '#f5f3ff' : '#f9fafb',
                            border: `1.5px solid ${sel ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px',
                          }}>
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                              border: `2px solid ${sel ? '#7c3aed' : '#d1d5db'}`, background: sel ? '#7c3aed' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: sel ? 600 : 400, color: '#374151' }}>{doc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CanLII section */}
                <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>CanLII Lookup</div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <input type="text" value={canLIIQuery} onChange={(e) => setCanLIIQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && openCanLII()}
                      placeholder="Search case law..." style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
                    <button onClick={() => openCanLII()} style={{ padding: '7px 12px', fontSize: '11px', fontWeight: 600, background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Criminal Code', query: 'Criminal Code RSC 1985 c C-46' },
                      { label: 'Charter', query: 'Canadian Charter of Rights and Freedoms' },
                      { label: 'CDSA', query: 'Controlled Drugs and Substances Act' },
                      { label: 'Ontario Courts', query: '' },
                    ].map(link => (
                      <button key={link.label} onClick={() => link.query ? openCanLII(link.query) : window.open('https://www.canlii.org/en/on/', '_blank')}
                        style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 500, background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '10px', cursor: 'pointer' }}>
                        {link.label}
                      </button>
                    ))}
                  </div>
                  {/* Referenced cases from result */}
                  {activeMotionResult?.key_case_law && activeMotionResult.key_case_law.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Cited cases:</div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {activeMotionResult.key_case_law.slice(0, 5).map((c, i) => (
                          <button key={i} onClick={() => openCanLII(c.case)} style={{
                            padding: '2px 6px', fontSize: '10px', fontWeight: 500, background: '#fef3c7', color: '#78350f',
                            border: '1px solid #fcd34d', borderRadius: '4px', cursor: 'pointer',
                          }} title={c.relevance}>{c.case}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions section - only after generation */}
                {motionGenStep === 'done' && activeMotionResult && (
                  <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button onClick={() => { navigator.clipboard.writeText(getFullMotionText(activeMotionResult)); toast.success('Copied to clipboard'); }} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                        background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', width: '100%',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Motion
                      </button>
                      <button onClick={() => handleDownloadMotion(activeMotionResult)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                        background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', width: '100%',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Download
                      </button>
                      <button onClick={() => setShowAddToCase(!showAddToCase)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                        background: showAddToCase ? '#eff6ff' : '#f9fafb', color: showAddToCase ? '#2563eb' : '#374151',
                        border: `1px solid ${showAddToCase ? '#93c5fd' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', width: '100%',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Add to Case
                      </button>
                    </div>
                    {showAddToCase && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input type="text" value={caseOrPersonName} onChange={(e) => setCaseOrPersonName(e.target.value)}
                            placeholder="Case name or file #" style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
                          <button onClick={() => { setAddToCaseSaved(true); setShowAddToCase(false); setCaseOrPersonName(''); setTimeout(() => setAddToCaseSaved(false), 3000); }} disabled={!caseOrPersonName.trim()}
                            style={{ padding: '7px 12px', fontSize: '11px', fontWeight: 600, background: caseOrPersonName.trim() ? '#2563eb' : '#e5e7eb', color: caseOrPersonName.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                    {addToCaseSaved && (
                      <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Saved to case
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conversation Flow ── */}
      <AnimatePresence>
        {isRegularConversation && (
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
