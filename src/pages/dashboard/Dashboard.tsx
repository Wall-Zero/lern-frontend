import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetsApi } from '../../api/endpoints/datasets';
import { generateStream, motionIntake } from '../../api/endpoints/aitools';
import apiClient from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import type { Dataset } from '../../types/dataset.types';

const formatFileType = (type: string) => type.toUpperCase();

type Tab = 'legal' | 'data';
type ConversationStep = 'idle' | 'gemini_loading' | 'gemini_streaming' | 'gemini_done' | 'gpt_loading' | 'gpt_streaming' | 'gpt_done';
type MessageRole = 'user' | 'gemini' | 'gpt' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

// Motion types
type MotionProvider = 'claude' | 'gemini' | 'gpt4' | 'lern-2.1' | 'lern-1.9';
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

const JURISDICTIONS: Record<string, { label: string; states: Array<{ value: string; label: string }> }> = {
  canada: {
    label: 'Canada',
    states: [
      { value: 'ontario', label: 'Ontario' },
      { value: 'british_columbia', label: 'British Columbia' },
      { value: 'alberta', label: 'Alberta' },
      { value: 'quebec', label: 'Quebec' },
      { value: 'manitoba', label: 'Manitoba' },
      { value: 'saskatchewan', label: 'Saskatchewan' },
      { value: 'nova_scotia', label: 'Nova Scotia' },
      { value: 'new_brunswick', label: 'New Brunswick' },
      { value: 'newfoundland', label: 'Newfoundland & Labrador' },
      { value: 'pei', label: 'Prince Edward Island' },
      { value: 'nwt', label: 'Northwest Territories' },
      { value: 'yukon', label: 'Yukon' },
      { value: 'nunavut', label: 'Nunavut' },
    ],
  },
  us: {
    label: 'United States',
    states: [
      { value: 'california', label: 'California' },
      { value: 'new_york', label: 'New York' },
      { value: 'texas', label: 'Texas' },
      { value: 'florida', label: 'Florida' },
      { value: 'illinois', label: 'Illinois' },
      { value: 'pennsylvania', label: 'Pennsylvania' },
      { value: 'ohio', label: 'Ohio' },
      { value: 'georgia', label: 'Georgia' },
      { value: 'michigan', label: 'Michigan' },
      { value: 'north_carolina', label: 'North Carolina' },
      { value: 'new_jersey', label: 'New Jersey' },
      { value: 'virginia', label: 'Virginia' },
      { value: 'washington', label: 'Washington' },
      { value: 'massachusetts', label: 'Massachusetts' },
      { value: 'arizona', label: 'Arizona' },
      { value: 'colorado', label: 'Colorado' },
      { value: 'maryland', label: 'Maryland' },
      { value: 'minnesota', label: 'Minnesota' },
      { value: 'tennessee', label: 'Tennessee' },
      { value: 'indiana', label: 'Indiana' },
    ],
  },
};

const PROVIDER_INFO: Record<string, { name: string; color: string; bg: string }> = {
  claude: { name: 'LERN 2.1', color: '#0d9488', bg: '#f0fdfa' },
  gemini: { name: 'LERN 2.1', color: '#0d9488', bg: '#f0fdfa' },
  gpt4: { name: 'LERN 2.1', color: '#0d9488', bg: '#f0fdfa' },
  'lern-2.1': { name: 'LERN 2.1', color: '#0d9488', bg: '#f0fdfa' },
  'lern-1.9': { name: 'LERN 1.9.1', color: '#0f766e', bg: '#f0fdfa' },
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

const legalSuggestions: { label: string; icon: string; tool: string }[] = [];

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
  const [, setDirection] = useState(0);
  const [intent, setIntent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentDocs, setRecentDocs] = useState<Dataset[]>([]);
  const [, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [heroUploadedFiles, setHeroUploadedFiles] = useState<Array<{ name: string; uploading: boolean }>>([]);
  const [selectedContextDocs, setSelectedContextDocs] = useState<number[]>([]);

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
  // Jurisdiction state
  const [jurisdictionCountry, setJurisdictionCountry] = useState('canada');
  const [jurisdictionState, setJurisdictionState] = useState('ontario');

  // Motion mode state
  const [motionMode, setMotionMode] = useState(false);
  const [motionConversation, setMotionConversation] = useState<MotionMessage[]>([]);
  const [motionInput, setMotionInput] = useState('');
  const [motionLoading, setMotionLoading] = useState(false);
  const [motionType, setMotionType] = useState('charter_s8');
  const [motionWorkflow] = useState<MotionWorkflow>('refine');
  const [creatorProvider] = useState<MotionProvider>('claude');
  const [refinerProvider] = useState<MotionProvider>('gemini');
  const [orchestrator, setOrchestrator] = useState<'lern-2.1' | 'lern-1.9'>('lern-2.1');
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
    if (motionMode) {
      datasetsApi.list().then(res => {
        setMotionDocs((res.results || []).map((ds: { id: number; name: string; type?: string }) => ({
          id: ds.id, name: ds.name, type: ds.type || 'file',
        })));
      }).catch(() => {});
    }
  }, [motionMode]);

  const getJurisdictionContext = () => {
    const country = JURISDICTIONS[jurisdictionCountry];
    const state = country?.states.find(s => s.value === jurisdictionState);
    return `[Jurisdiction: ${country?.label || jurisdictionCountry}, ${state?.label || jurisdictionState}. Apply ${jurisdictionCountry === 'canada' ? 'Canadian' : 'US'} law for this jurisdiction.]`;
  };

  const enterMotionMode = (initialMessage: string) => {
    setMotionMode(true);
    // Carry sidebar-selected docs into motion mode
    const sidebarDocIds = [...selectedContextDocs];
    if (sidebarDocIds.length > 0) {
      setMotionSelectedDocs(prev => [...new Set([...prev, ...sidebarDocIds])]);
    }
    setMotionConversation([{ role: 'user', content: initialMessage }]);
    setMotionResult(null);
    setMotionRefineResult(null);
    setMotionGenStep('idle');
    // Detect motion type from message
    const lower = initialMessage.toLowerCase();
    if (lower.includes('disclosure')) setMotionType('disclosure');
    else if (lower.includes('stay')) setMotionType('stay_of_proceedings');
    else setMotionType('charter_s8');

    // Auto-start intake: resolve hero doc IDs first if any, then fire
    const heroNames = heroUploadedFiles.filter(f => !f.uploading).map(f => f.name);
    const doStart = (extraDocIds: number[] = []) => {
      const allSelectedIds = [...new Set([...sidebarDocIds, ...extraDocIds])];
      const heroCtx = heroNames.length > 0
        ? ` [User has uploaded these documents for reference: ${heroNames.join(', ')}.]`
        : '';
      const docCtx = allSelectedIds.length > 0
        ? ` [User has selected these existing documents as context: ${allSelectedIds.map(id => {
            const d = motionDocs.find(doc => doc.id === id);
            return d ? d.name : `doc#${id}`;
          }).join(', ')}.]`
        : '';
      const contextMsg = `${getJurisdictionContext()}${heroCtx}${docCtx} ${initialMessage}`;
      const conversation: MotionMessage[] = [{ role: 'user', content: contextMsg }];
      setMotionLoading(true);
      motionIntake({
        conversation,
        motion_type: lower.includes('disclosure') ? 'disclosure' : lower.includes('stay') ? 'stay_of_proceedings' : 'charter_s8',
        provider: 'gemini',
        reference_document_ids: allSelectedIds.length > 0 ? allSelectedIds : undefined,
      }).then(res => {
        if (res.ready) {
          handleMotionReady(res, conversation);
        } else {
          setMotionConversation(prev => [...prev, { role: 'assistant', content: res.question }]);
        }
      }).catch(err => {
        console.error(err);
      }).finally(() => setMotionLoading(false));
    };

    if (heroNames.length > 0) {
      // Fetch doc list to resolve hero file IDs, then start
      datasetsApi.list().then(res => {
        const allDocs = (res.results || []).map((ds: { id: number; name: string; type?: string }) => ({
          id: ds.id, name: ds.name, type: ds.type || 'file',
        }));
        setMotionDocs(allDocs);
        const heroIds = allDocs.filter((d: { name: string }) => heroNames.includes(d.name)).map((d: { id: number }) => d.id);
        if (heroIds.length > 0) {
          setMotionSelectedDocs(prev => [...new Set([...prev, ...heroIds])]);
        }
        doStart(heroIds);
      }).catch(() => doStart());
    } else {
      doStart();
    }
  };

  const startMotionIntake = (additionalMessage?: string) => {
    const initialMessage = motionConversation.find(m => m.role === 'user')?.content || '';
    const heroContext = heroUploadedFiles.filter(f => !f.uploading).length > 0
      ? ` [User has uploaded these documents for reference: ${heroUploadedFiles.filter(f => !f.uploading).map(f => f.name).join(', ')}.]`
      : '';
    const docContext = motionSelectedDocs.length > 0
      ? ` [User has selected these existing documents as context: ${motionDocs.filter(d => motionSelectedDocs.includes(d.id)).map(d => d.name).join(', ')}.]`
      : '';
    const contextMsg = `${getJurisdictionContext()}${heroContext}${docContext} ${initialMessage}`;
    const conversation: MotionMessage[] = [{ role: 'user', content: contextMsg }];

    if (additionalMessage) {
      setMotionConversation(prev => [...prev, { role: 'user', content: additionalMessage }]);
      conversation.push({ role: 'user', content: additionalMessage });
    }

    setMotionLoading(true);
    motionIntake({
      conversation,
      motion_type: motionType,
      provider: 'gemini',
      reference_document_ids: motionSelectedDocs.length > 0 ? motionSelectedDocs : undefined,
    }).then(res => {
      if (res.ready) {
        handleMotionReady(res, conversation);
      } else {
        setMotionConversation(prev => [...prev, { role: 'assistant', content: res.question }]);
      }
    }).catch(err => {
      toast.error('Failed to start motion intake');
      console.error(err);
    }).finally(() => setMotionLoading(false));
  };

  // Skip remaining intake questions and generate immediately
  const handleGenerateNow = async () => {
    if (motionLoading || motionGenerating) return;
    const skipMsg = 'I don\'t have more details right now. Please proceed with the information provided and use reasonable professional defaults for any missing fields. Generate the motion now.';
    const updatedConv = [...motionConversation, { role: 'user' as const, content: skipMsg }];
    setMotionConversation(prev => [...prev, { role: 'user', content: 'Generate with the details provided' }]);
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
        // If still not ready, force generation with what we have
        handleMotionReady({
          case_details: { client_name: 'Client', court_location: 'Superior Court of Justice', court_file_no: 'CR-2025-00001', charges: 'As described', date_of_incident: 'As described', arresting_officer: 'Unknown' },
          case_description: motionConversation.filter(m => m.role === 'user').map(m => m.content).join('. '),
          motion_type: motionType,
        }, updatedConv);
      }
    } catch (err) {
      toast.error('Failed to generate');
      console.error(err);
    } finally {
      setMotionLoading(false);
    }
  };

  const handleMotionMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = motionInput.trim();
    if (!msg || motionLoading) return;

    // If motion is already generated, route to post-gen refinement
    if (motionGenStep === 'done' && (motionRefineResult || motionResult)) {
      setMotionConversation(prev => [...prev, { role: 'user', content: msg }]);
      setMotionInput('');
      handlePostGenRefinement(msg);
      return;
    }

    // If no assistant messages yet (still in document selection phase), start intake with this as additional context
    const hasAssistantMessage = motionConversation.some(m => m.role === 'assistant');
    if (!hasAssistantMessage) {
      setMotionInput('');
      startMotionIntake(msg);
      return;
    }

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

  // Map orchestrator/LERN values to real backend providers
  const toBackendProvider = (p: MotionProvider): string => {
    if (p === 'lern-2.1') return 'gemini';   // LERN 2.1 Beta → routes through Gemini
    if (p === 'lern-1.9') return 'claude';    // LERN 1.9.1 Stable → routes through Claude
    return p;
  };

  const handlePostGenRefinement = async (userFeedback: string) => {
    // Get the current active result to refine
    const currentResult = motionRefineResult
      ? (motionActiveTab === 'initial' ? motionRefineResult.initial : motionRefineResult.refined)
      : motionResult;
    if (!currentResult) return;

    setMotionGenerating(true);
    // Keep motionGenStep as 'done' so the motion document stays visible
    setMotionProgress(0);

    const progressInterval = setInterval(() => {
      setMotionProgress(prev => prev >= 90 ? 90 : prev + Math.random() * 3 + 0.5);
    }, 500);

    const backendRefiner = toBackendProvider(refinerProvider);

    try {
      const refineRes = await apiClient.post('/ai-tools/refine_draft/', {
        motion_type: motionType,
        case_details: {},
        case_description: `User refinement request: "${userFeedback}". Include extensive case law citations. Reference the most relevant and recent court decisions.`,
        original_motion: currentResult,
        refiner_provider: backendRefiner,
      });

      if (refineRes.data.success) {
        const previousInitial = motionRefineResult?.initial || motionResult || currentResult;
        setMotionRefineResult({ initial: previousInitial, refined: refineRes.data.refined_result });
        setMotionActiveTab('refined');
        setMotionConversation(prev => [...prev, {
          role: 'assistant',
          content: `Done! I've refined the motion based on your feedback. The changes have been applied.`,
        }]);
      } else {
        setMotionConversation(prev => [...prev, {
          role: 'assistant',
          content: 'Refinement returned without changes. Please try a more specific request.',
        }]);
      }

      setMotionProgress(100);
    } catch (err) {
      toast.error('Refinement failed');
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setMotionGenerating(false);
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

    const backendCreator = toBackendProvider(creatorProvider);
    const backendRefiner = toBackendProvider(refinerProvider);
    const caseLawEnhanced = intakeResult.case_description + ' Include extensive case law citations. Reference the most relevant and recent court decisions.';

    try {
      if (motionWorkflow === 'refine') {
        // Step 1: Generate with creator
        const createRes = await apiClient.post('/ai-tools/generate_motion/', {
          motion_type: intakeResult.motion_type,
          case_details: intakeResult.case_details,
          case_description: caseLawEnhanced,
          reference_document_ids: motionSelectedDocs,
          providers: [backendCreator],
        });
        const initialDraft = createRes.data.results?.[backendCreator];
        if (!initialDraft?.success) throw new Error('Draft generation failed');

        setMotionProgress(100);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Refine
        setMotionGenStep('refining');
        setMotionProgress(0);

        const refineRes = await apiClient.post('/ai-tools/refine_draft/', {
          motion_type: intakeResult.motion_type,
          case_details: intakeResult.case_details,
          case_description: caseLawEnhanced,
          original_motion: initialDraft,
          refiner_provider: backendRefiner,
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
          case_description: caseLawEnhanced,
          reference_document_ids: motionSelectedDocs,
          providers: [backendCreator],
        });
        const result = res.data.results?.[backendCreator];
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
    const uploadedNames: string[] = [];
    // Get existing docs to skip duplicates
    const existingNames = motionDocs.map(d => d.name);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (existingNames.includes(file.name)) {
        uploadedNames.push(file.name);
        continue;
      }
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const typeMap: Record<string, string> = {
          pdf: 'pdf', doc: 'doc', docx: 'docx', txt: 'txt', md: 'md',
          csv: 'csv', xlsx: 'excel', xls: 'excel', json: 'json',
        };
        await datasetsApi.create({ name: file.name, type: typeMap[ext] || ext, file });
        uploadedNames.push(file.name);
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
    }
    // Refresh docs and auto-select newly uploaded ones by matching name
    try {
      const res = await datasetsApi.list();
      const allDocs = (res.results || []).map((ds: { id: number; name: string; type?: string }) => ({
        id: ds.id, name: ds.name, type: ds.type || 'file',
      }));
      setMotionDocs(allDocs);
      // Auto-select the docs we just uploaded
      const newIds = allDocs.filter((d: { name: string }) => uploadedNames.includes(d.name)).map((d: { id: number }) => d.id);
      if (newIds.length > 0) {
        setMotionSelectedDocs(prev => [...new Set([...prev, ...newIds])]);
      }
      const sorted = res.results
        .sort((a: Dataset, b: Dataset) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
      setRecentDocs(sorted);
    } catch {}
    if (motionFileInputRef.current) motionFileInputRef.current.value = '';
  };

  const handleHeroFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Check for existing docs with same name to avoid duplicates
    let existingDocs: Array<{ id: number; name: string }> = [];
    try {
      const res = await datasetsApi.list();
      existingDocs = (res.results || []).map((ds: { id: number; name: string }) => ({ id: ds.id, name: ds.name }));
    } catch {}

    const newFiles = Array.from(files).map(f => ({ name: f.name, uploading: true }));
    setHeroUploadedFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Skip upload if doc with same name already exists
      const existing = existingDocs.find(d => d.name === file.name);
      if (existing) {
        setHeroUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, uploading: false } : f));
        toast.success(`Using existing ${file.name}`);
        continue;
      }
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const typeMap: Record<string, string> = {
          pdf: 'pdf', doc: 'doc', docx: 'docx', txt: 'txt', md: 'md',
          csv: 'csv', xlsx: 'excel', xls: 'excel', json: 'json',
        };
        await datasetsApi.create({ name: file.name, type: typeMap[ext] || ext, file });
        setHeroUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, uploading: false } : f));
        toast.success(`Uploaded ${file.name}`);
      } catch {
        setHeroUploadedFiles(prev => prev.filter(f => f.name !== file.name));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    // Refresh recent docs
    try {
      const res = await datasetsApi.list();
      const sorted = res.results
        .sort((a: Dataset, b: Dataset) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
      setRecentDocs(sorted);
    } catch {}
    if (heroFileInputRef.current) heroFileInputRef.current.value = '';
  };

  // Build context prefix with jurisdiction and uploaded/selected docs
  const buildContextPrefix = () => {
    const parts: string[] = [];
    if (activeTab === 'legal') {
      parts.push(getJurisdictionContext());
    }
    // Include hero-uploaded files
    if (heroUploadedFiles.filter(f => !f.uploading).length > 0) {
      const docNames = heroUploadedFiles.filter(f => !f.uploading).map(f => f.name).join(', ');
      parts.push(`[User has uploaded these documents for reference: ${docNames}. Analyze them in context of the request.]`);
    }
    // Include sidebar-selected context documents
    if (selectedContextDocs.length > 0) {
      const selectedNames = recentDocs.filter(d => selectedContextDocs.includes(d.id)).map(d => d.name).join(', ');
      if (selectedNames) {
        parts.push(`[User has selected these existing documents as context: ${selectedNames}. Use them as reference for the request.]`);
      }
    }
    return parts.length > 0 ? parts.join(' ') + ' ' : '';
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

    const contextQuery = buildContextPrefix() + query;

    setTimeout(() => {
      setConversationStep('gemini_streaming');
      abortControllerRef.current = generateStream(
        { prompt: contextQuery, provider: 'gemini', max_tokens: 8000 },
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
      const base = activeTab === 'legal' ? '/dashboard' : '/data';
      const params = new URLSearchParams();
      params.set('intent', label);
      params.set('tool', tool);
      navigate(`${base}?${params.toString()}`);
    } else {
      startConversationFromSuggestion(label);
    }
  };

  const suggestions = activeTab === 'legal' ? legalSuggestions : dataSuggestions;
  const accent = activeTab === 'legal' ? '#0d9488' : '#0d9488';

  const isConversationActive = conversationStep !== 'idle' || motionMode;
  const isRegularConversation = conversationStep !== 'idle' && !motionMode;
  const isAnyLoading = conversationStep === 'gemini_loading' || conversationStep === 'gpt_loading';
  const isStreaming = conversationStep === 'gemini_streaming' || conversationStep === 'gpt_streaming';

  // Get the active motion result for display
  const activeMotionResult = motionRefineResult
    ? (motionActiveTab === 'initial' ? motionRefineResult.initial : motionRefineResult.refined)
    : motionResult;

  return (
    <div style={{ minHeight: '100vh', height: '100vh', fontFamily: '"DM Sans", "Outfit", sans-serif', display: 'flex', width: '100%' }}>
      {/* ── Left Sidebar ── */}
      <aside style={{
        width: '272px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div
            onClick={motionMode ? resetMotionMode : resetConversation}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.03em' }}>L</span>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>LERN</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>v1.2.1</div>
            </div>
          </div>
        </div>

        {/* New Conversation button */}
        <div style={{ padding: '12px 16px 8px' }}>
          <button
            onClick={motionMode ? resetMotionMode : resetConversation}
            style={{
              width: '100%', padding: '10px 14px', fontSize: '13px', fontWeight: 600,
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', border: 'none', borderRadius: '10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Conversations section */}
        <div style={{ padding: '8px 16px 4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Recent
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {/* Demo conversation history items */}
          {[
            { title: 'Charter s.8 — R v. Thompson', time: '2h ago', icon: 'doc' },
            { title: 'Disclosure Application — File #2847', time: '5h ago', icon: 'doc' },
            { title: 'Stay of Proceedings Brief', time: '1d ago', icon: 'doc' },
            { title: 'Contract Risk Analysis — NDA v3', time: '2d ago', icon: 'search' },
            { title: 'Sales Data Correlation Report', time: '3d ago', icon: 'chart' },
          ].map((conv, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent',
                border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }}>
                {conv.icon === 'doc' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                {conv.icon === 'search' && <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                {conv.icon === 'chart' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{conv.title}</div>
                <div style={{ fontSize: '11px', color: '#b0b8c4', marginTop: '2px' }}>{conv.time}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Documents section — click to add as context */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Documents
            </div>
            <button
              onClick={() => motionFileInputRef.current?.click()}
              style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600, background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: '4px', cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>
          {selectedContextDocs.length > 0 && (
            <div style={{ fontSize: '10px', color: '#0d9488', fontWeight: 600, marginBottom: '6px' }}>
              {selectedContextDocs.length} selected as context
            </div>
          )}
          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
            {recentDocs.length > 0 ? recentDocs.slice(0, 8).map((doc) => {
              const isSelected = selectedContextDocs.includes(doc.id);
              return (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                  borderRadius: '6px', marginBottom: '2px', cursor: 'pointer',
                  background: isSelected ? '#f0fdfa' : 'transparent',
                  border: isSelected ? '1px solid #99f6e4' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  onClick={() => setSelectedContextDocs(prev =>
                    isSelected ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                  )}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#0d9488' : '#d1d5db'}`,
                    background: isSelected ? '#0d9488' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0f172a' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isSelected ? '#0d9488' : '#94a3b8', background: isSelected ? '#ccfbf1' : '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>
                    {formatFileType(doc.type)}
                  </span>
                </div>
              );
            }) : (
              <div style={{ fontSize: '12px', color: '#b0b8c4', padding: '8px', textAlign: 'center' }}>No documents yet</div>
            )}
          </div>
        </div>

        {/* LERN Assistant - Coming Soon */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          <button style={{
            width: '100%', padding: '12px 14px', fontSize: '13px', fontWeight: 600,
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'default',
            display: 'flex', alignItems: 'center', gap: '10px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>LERN Assistant</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Calendar, Tasks, Reminders</div>
            </div>
            <span style={{
              position: 'absolute', top: '6px', right: '8px',
              fontSize: '8px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff',
              padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em',
              textTransform: 'uppercase', border: '1px solid #ede9fe',
            }}>
              Coming Soon
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap');

        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(10px); }
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
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-10px, 15px) scale(0.98); }
          75% { transform: translate(20px, 10px) scale(1.02); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.03); }
          66% { transform: translate(15px, -15px) scale(0.97); }
        }
        @keyframes subtle-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes input-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .hero-section {
          position: relative;
          overflow: hidden;
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          will-change: transform;
        }
        .hero-orb-1 {
          width: 400px;
          height: 400px;
          top: -120px;
          left: -80px;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%);
          animation: orb-drift 12s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 300px;
          height: 300px;
          top: -40px;
          right: -60px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          animation: orb-drift-2 10s ease-in-out infinite;
        }
        .hero-orb-3 {
          width: 200px;
          height: 200px;
          bottom: -80px;
          left: 40%;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%);
          animation: orb-drift 15s ease-in-out infinite reverse;
        }

        .hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(13, 148, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13, 148, 136, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse at 50% 50%, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 30%, transparent 70%);
          pointer-events: none;
        }

        .input-wrapper {
          position: relative;
          border-radius: 20px;
          padding: 2px;
          background: linear-gradient(135deg, #0d9488, #6366f1, #0d9488, #475569);
          background-size: 300% 300%;
          animation: gradient-rotate 8s ease infinite;
        }
        .input-wrapper.focused {
          box-shadow: 0 0 60px rgba(13, 148, 136, 0.2), 0 0 120px rgba(99, 102, 241, 0.06);
        }
        .input-inner {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 18px;
          display: flex;
          align-items: center;
          padding: 6px 6px 6px 22px;
          gap: 12px;
        }
        .hero-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #0f172a;
          padding: 16px 0;
          min-width: 0;
          letter-spacing: -0.01em;
        }
        .hero-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .go-btn {
          border: none;
          border-radius: 14px;
          padding: 16px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
        }
        .go-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(13, 148, 136, 0.3);
          background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 100px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          animation: float-in 0.5s ease backwards;
          letter-spacing: -0.01em;
        }
        .chip:hover {
          border-color: rgba(13, 148, 136, 0.4);
          color: #0d9488;
          background: rgba(240, 253, 250, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(13, 148, 136, 0.12);
        }

        .toggle-track {
          display: flex;
          padding: 4px;
          background: rgba(241, 245, 249, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          position: relative;
          width: fit-content;
          margin: 0 auto;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }
        .toggle-btn {
          position: relative;
          z-index: 1;
          padding: 11px 32px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #94a3b8;
          letter-spacing: -0.01em;
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
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 28px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .tool-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, transparent 40%, rgba(13, 148, 136, 0.2) 60%, transparent 80%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .tool-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(13, 148, 136, 0.06);
          border-color: rgba(13, 148, 136, 0.15);
          background: rgba(255, 255, 255, 0.9);
        }
        .tool-card:hover::before {
          opacity: 1;
        }
        .tool-card .arrow-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tool-card:hover .arrow-icon {
          transform: translateX(6px);
          color: #0d9488;
        }

        .recent-row {
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .recent-row:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        .step-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
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
          font-family: 'DM Sans', sans-serif;
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
          font-family: 'DM Sans', sans-serif;
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
          font-family: 'DM Sans', sans-serif;
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
          font-family: 'DM Sans', sans-serif;
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
          background: #0f172a;
          color: #e2e8f0;
          padding: 14px 16px;
          border-radius: 10px;
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

        .version-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px 4px 8px;
          border-radius: 100px;
          background: rgba(13, 148, 136, 0.08);
          border: 1px solid rgba(13, 148, 136, 0.15);
          font-size: 12px;
          font-weight: 500;
          color: #0d9488;
          letter-spacing: 0.02em;
        }
        .version-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0d9488;
          animation: subtle-glow 2s ease-in-out infinite;
        }

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="hero-section" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '52px 32px 44px',
              background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)',
              transition: 'background 0.3s ease',
            }}>
              {/* Floating orbs */}
              <div className="hero-orb hero-orb-1" />
              <div className="hero-orb hero-orb-2" />
              <div className="hero-orb hero-orb-3" />
              {/* Grid pattern */}
              <div className="hero-grid-pattern" />

              <div style={{ maxWidth: '720px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                {/* Version pill */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{ marginBottom: '20px' }}
                >
                  <span className="version-pill">
                    <span className="version-dot" />
                    LERN v1.2.1
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    fontSize: '42px',
                    fontWeight: 300,
                    color: '#0f172a',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    fontFamily: '"Instrument Serif", Georgia, serif',
                  }}
                >
                  What are you{' '}
                  <span style={{
                    fontStyle: 'italic',
                    background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>working on</span>?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    fontSize: '15px',
                    color: '#64748b',
                    margin: '0 0 28px 0',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  AI-powered legal drafting and data analysis
                </motion.p>

                {/* Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  style={{ marginBottom: '28px' }}
                >
                  <div className="toggle-track">
                    <motion.div
                      className="toggle-indicator"
                      animate={{
                        left: activeTab === 'legal' ? '4px' : '50%',
                        width: 'calc(50% - 4px)',
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
                        boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                    <button
                      className={`toggle-btn ${activeTab === 'legal' ? 'active' : ''}`}
                      onClick={() => switchTab('legal')}
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Legal
                    </button>
                    <button
                      className={`toggle-btn ${activeTab === 'data' ? 'active' : ''}`}
                      onClick={() => switchTab('data')}
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Data
                    </button>
                  </div>
                </motion.div>

                {/* Jurisdiction dropdowns — legal mode only */}
                {activeTab === 'legal' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={1.5} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      <select
                        value={jurisdictionCountry}
                        onChange={(e) => {
                          setJurisdictionCountry(e.target.value);
                          setJurisdictionState(JURISDICTIONS[e.target.value]?.states[0]?.value || '');
                        }}
                        style={{
                          appearance: 'none',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '7px 28px 7px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#334155',
                          cursor: 'pointer',
                          fontFamily: '"DM Sans", sans-serif',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                        }}
                      >
                        {Object.entries(JURISDICTIONS).map(([key, j]) => (
                          <option key={key} value={key}>{j.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={1.5} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <select
                        value={jurisdictionState}
                        onChange={(e) => setJurisdictionState(e.target.value)}
                        style={{
                          appearance: 'none',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '7px 28px 7px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#334155',
                          cursor: 'pointer',
                          fontFamily: '"DM Sans", sans-serif',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                        }}
                      >
                        {JURISDICTIONS[jurisdictionCountry]?.states.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
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
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                </motion.div>

                {/* Suggestion Chips */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab + '-chips'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="chips-row"
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '20px',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={s.label}
                        className="chip"
                        onClick={() => handleSuggestion(s.label, s.tool)}
                        style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.5} style={{ opacity: 0.5 }}>
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

                {/* Add context / documents button + uploaded files */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                >
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => handleHeroFileUpload(e.target.files)}
                  />
                  <button
                    onClick={() => heroFileInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '14px 32px', fontSize: '15px', fontWeight: 600,
                      background: 'rgba(240, 253, 250, 0.6)', color: '#0f766e',
                      border: '2px dashed rgba(13, 148, 136, 0.35)', borderRadius: '14px', cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 2px 8px rgba(13, 148, 136, 0.06)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240, 253, 250, 0.9)'; e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.5)'; e.currentTarget.style.color = '#0d9488'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(13, 148, 136, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(240, 253, 250, 0.6)'; e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.35)'; e.currentTarget.style.color = '#0f766e'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 148, 136, 0.06)'; }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add context or documents
                  </button>

                  {/* Uploaded files display */}
                  {heroUploadedFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
                      {heroUploadedFiles.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '5px 10px', fontSize: '12px', fontWeight: 500,
                          background: f.uploading ? '#f9fafb' : '#f5f3ff',
                          color: f.uploading ? '#9ca3af' : '#6d28d9',
                          border: `1px solid ${f.uploading ? '#e5e7eb' : '#ddd6fe'}`,
                          borderRadius: '8px',
                        }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name}
                          {f.uploading && (
                            <div style={{ width: '12px', height: '12px', border: '2px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          )}
                          {!f.uploading && (
                            <button onClick={() => setHeroUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9ca3af',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
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
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 24px', gap: '24px' }}>
              {/* Main conversation column */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Motion header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'linear-gradient(135deg, #0d9488, #4b5563)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Motion Drafter
                  </p>
                </motion.div>

                {/* Document names shown in chat are rendered after each user message below */}

                {/* Chat messages */}
                {motionConversation.map((msg, i) => (
                  <React.Fragment key={`motion-msg-${i}`}>
                    <motion.div
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
                    {/* Show attached documents after first user message */}
                    {i === 0 && msg.role === 'user' && (() => {
                      // Gather doc names from motionDocs (matched by ID) + heroUploadedFiles as fallback
                      const fromMotionDocs = motionDocs.filter(d => motionSelectedDocs.includes(d.id)).map(d => ({ key: `md-${d.id}`, name: d.name }));
                      const heroNames = heroUploadedFiles.filter(f => !f.uploading).map((f, idx) => ({ key: `hero-${idx}`, name: f.name }));
                      // Deduplicate by name — motionDocs take priority, hero names fill in before async resolves
                      const seen = new Set<string>();
                      const allDocs = [...fromMotionDocs, ...heroNames].filter(d => { if (seen.has(d.name)) return false; seen.add(d.name); return true; });
                      if (allDocs.length === 0) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          style={{ display: 'flex', justifyContent: 'flex-end' }}
                        >
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '80%' }}>
                            {allDocs.map(doc => (
                              <span key={doc.key} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', fontSize: '11px', fontWeight: 500,
                                background: 'rgba(75, 85, 99, 0.08)', color: '#6b7280',
                                border: '1px solid #e5e7eb', borderRadius: '8px',
                              }}>
                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01a1.5 1.5 0 01-2.122-2.122" /></svg>
                                {doc.name.length > 30 ? doc.name.slice(0, 27) + '...' : doc.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </React.Fragment>
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
                        { key: 'creating', label: 'Analyzing case & drafting motion' },
                        ...(motionWorkflow === 'refine' ? [{ key: 'refining', label: 'Enhancing & strengthening arguments' }] : []),
                      ].map((step, idx) => {
                        const isActive = step.key === motionGenStep;
                        const isComplete = (step.key === 'creating' && motionGenStep === 'refining');
                        const providerColor = '#0d9488';
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
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ position: 'relative' }}>
                    {/* Refining overlay */}
                    {motionGenerating && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
                        background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                          <div style={{ width: '18px', height: '18px', border: '2.5px solid #e5e7eb', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Refining motion...</span>
                        </div>
                      </div>
                    )}
                    {/* Workflow tabs for refine mode */}
                    {motionRefineResult && (
                      <>
                        <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Two versions generated — choose one to continue building
                          </div>
                          <p style={{ fontSize: '12px', color: '#15803d', margin: 0, lineHeight: 1.5 }}>Select a version below to keep iterating. You can enhance again at any time.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                          {[
                            { key: 'initial', label: 'Version A', sublabel: 'Initial draft' },
                            { key: 'refined', label: 'Version B', sublabel: 'Enhanced version' },
                          ].map(tab => {
                            const isSelected = motionActiveTab === tab.key;
                            const accentColor = '#0d9488';
                            return (
                              <button key={tab.key} onClick={() => setMotionActiveTab(tab.key)} style={{
                                padding: '14px 16px', fontSize: '13px', fontWeight: 600,
                                background: isSelected ? '#fff' : '#f9fafb',
                                color: isSelected ? accentColor : '#6b7280',
                                border: `2px solid ${isSelected ? accentColor : '#e5e7eb'}`,
                                borderRadius: '12px', cursor: 'pointer',
                                boxShadow: isSelected ? `0 4px 16px ${accentColor}20` : 'none',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                position: 'relative',
                              }}>
                                {isSelected && (
                                  <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </div>
                                )}
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, display: 'inline-block', marginRight: '8px' }} />
                                {tab.label}
                                <div style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af', marginTop: '4px' }}>{tab.sublabel}</div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Enhancement notes */}
                    {motionActiveTab === 'refined' && motionRefineResult?.refined?.refinement_notes && (
                      <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '14px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Enhancement Notes</div>
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

                    {/* Motion document — styled as formal legal document */}
                    {activeMotionResult.motion ? (
                      <div style={{
                        background: '#fff',
                        borderRadius: '2px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                        padding: '48px 56px',
                        fontFamily: "'Times New Roman', 'Georgia', serif",
                        color: '#1a1a1a',
                        lineHeight: 1.8,
                        fontSize: '14px',
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative',
                      }}>
                        {/* Subtle left border accent */}
                        <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '3px', background: 'linear-gradient(180deg, #0d9488 0%, #5eead4 100%)', borderRadius: '0 2px 2px 0' }} />

                        {activeMotionResult.motion.header && (
                          <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #111' }}>
                            <pre style={{ fontFamily: "'Times New Roman', 'Georgia', serif", fontSize: '12px', whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a1a', lineHeight: 1.6, letterSpacing: '0.02em' }}>{activeMotionResult.motion.header}</pre>
                          </div>
                        )}
                        {activeMotionResult.motion.title && (
                          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#000', margin: '0 0 24px 0', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4 }}>{activeMotionResult.motion.title}</h2>
                        )}
                        {activeMotionResult.motion.introduction && (
                          <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.8, margin: 0, textAlign: 'justify', textIndent: '2em' }}>{activeMotionResult.motion.introduction}</p>
                          </div>
                        )}
                        {activeMotionResult.motion.relief_sought && activeMotionResult.motion.relief_sought.length > 0 && (
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Relief Sought</h3>
                            <ol style={{ margin: 0, paddingLeft: '24px' }}>
                              {activeMotionResult.motion.relief_sought.map((item, i) => <li key={i} style={{ fontSize: '14px', lineHeight: 1.8, marginBottom: '8px', textAlign: 'justify' }}>{item}</li>)}
                            </ol>
                          </div>
                        )}
                        {activeMotionResult.motion.grounds && activeMotionResult.motion.grounds.length > 0 && (
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Grounds</h3>
                            <ol style={{ margin: 0, paddingLeft: '24px' }}>
                              {activeMotionResult.motion.grounds.map((item, i) => <li key={i} style={{ fontSize: '14px', lineHeight: 1.8, marginBottom: '8px', textAlign: 'justify' }}>{item}</li>)}
                            </ol>
                          </div>
                        )}
                        {activeMotionResult.motion.factual_background && (
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Factual Background</h3>
                            <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', textAlign: 'justify', textIndent: '2em' }}>{activeMotionResult.motion.factual_background}</p>
                          </div>
                        )}
                        {activeMotionResult.motion.legal_argument && (
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Legal Argument</h3>
                            {activeMotionResult.motion.legal_argument.charter_violation && (
                              <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, fontStyle: 'italic', color: '#1a1a1a', margin: '0 0 8px 0' }}>Constitutional Violation</h4>
                                <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, textAlign: 'justify', textIndent: '2em' }}>{activeMotionResult.motion.legal_argument.charter_violation}</p>
                              </div>
                            )}
                            {activeMotionResult.motion.legal_argument.grant_analysis && (
                              <div style={{ marginTop: '16px', padding: '20px 24px', background: '#fafafa', borderLeft: '3px solid #6b7280', marginLeft: '8px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px 0', fontStyle: 'italic' }}>Framework Analysis</h4>
                                {activeMotionResult.motion.legal_argument.grant_analysis.seriousness_of_breach && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>i. Seriousness of Breach</span>
                                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', lineHeight: 1.8, textAlign: 'justify' }}>{activeMotionResult.motion.legal_argument.grant_analysis.seriousness_of_breach}</p>
                                  </div>
                                )}
                                {activeMotionResult.motion.legal_argument.grant_analysis.impact_on_accused && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>ii. Impact on the Accused</span>
                                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', lineHeight: 1.8, textAlign: 'justify' }}>{activeMotionResult.motion.legal_argument.grant_analysis.impact_on_accused}</p>
                                  </div>
                                )}
                                {activeMotionResult.motion.legal_argument.grant_analysis.society_interest && (
                                  <div>
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>iii. Society's Interest in Adjudication on the Merits</span>
                                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', lineHeight: 1.8, textAlign: 'justify' }}>{activeMotionResult.motion.legal_argument.grant_analysis.society_interest}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {activeMotionResult.motion.conclusion && (
                          <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Conclusion</h3>
                            <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, textAlign: 'justify', textIndent: '2em' }}>{activeMotionResult.motion.conclusion}</p>
                          </div>
                        )}
                        {activeMotionResult.motion.signature_block && (
                          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                            <pre style={{ fontFamily: "'Times New Roman', 'Georgia', serif", fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{activeMotionResult.motion.signature_block}</pre>
                          </div>
                        )}
                      </div>
                    ) : activeMotionResult.raw_motion && (
                      <div style={{
                        background: '#fff', borderRadius: '2px', border: '1px solid #d1d5db',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '48px 56px',
                        fontFamily: "'Times New Roman', 'Georgia', serif", maxWidth: '800px', margin: '0 auto',
                      }}>
                        <pre style={{ fontFamily: "'Times New Roman', 'Georgia', serif", fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a1a', lineHeight: 1.8 }}>{activeMotionResult.raw_motion}</pre>
                      </div>
                    )}

                    {/* Key case law */}
                    {activeMotionResult.key_case_law && activeMotionResult.key_case_law.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '16px', maxWidth: '800px', margin: '16px auto 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '0.02em' }}>Referenced Case Law</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeMotionResult.key_case_law.map((c, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #0d9488' }}>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', fontStyle: 'italic' }}>{c.case}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.5 }}>{c.relevance}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons after generation */}
                    <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getFullMotionText(activeMotionResult));
                          toast.success('Copied entire motion to clipboard');
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                          background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy
                      </button>
                      <button onClick={() => handleDownloadMotion(activeMotionResult)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                        background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Download
                      </button>
                      <button
                        onClick={() => motionFileInputRef.current?.click()}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                          background: '#fff', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: '10px', cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Add Documents
                      </button>
                      <button className="new-query-btn" onClick={resetMotionMode}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          New Motion
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Chat input - show during intake AND after generation for refinement */}
                {!motionGenerating && !motionLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    {/* Attached docs chips */}
                    {motionSelectedDocs.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px', paddingLeft: '2px' }}>
                        {motionDocs.filter(d => motionSelectedDocs.includes(d.id)).map(doc => (
                          <span key={doc.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', fontSize: '11px', fontWeight: 500,
                            background: '#f0fdfa', color: '#0f766e',
                            border: '1px solid #99f6e4', borderRadius: '6px',
                          }}>
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {doc.name.length > 25 ? doc.name.slice(0, 22) + '...' : doc.name}
                            <button onClick={() => setMotionSelectedDocs(prev => prev.filter(id => id !== doc.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9ca3af' }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleMotionMessage} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb',
                      padding: '6px 6px 6px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <input
                        ref={motionInputRef}
                        className="feedback-input"
                        type="text"
                        value={motionInput}
                        onChange={(e) => setMotionInput(e.target.value)}
                        placeholder={motionGenStep === 'done' ? 'Refine the motion further, or press Download...' : 'Type your response...'}
                      />
                      {/* Attach docs — paperclip icon */}
                      {motionGenStep !== 'done' && (
                        <button
                          type="button"
                          onClick={() => motionFileInputRef.current?.click()}
                          title="Attach documents"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', flexShrink: 0,
                            background: 'transparent', color: '#9ca3af',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#0d9488'; e.currentTarget.style.background = '#f0fdfa'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01a1.5 1.5 0 01-2.122-2.122" />
                          </svg>
                        </button>
                      )}
                      <button type="submit" className="refine-btn" disabled={!motionInput.trim()} style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Send
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </span>
                      </button>
                      {motionGenStep === 'done' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadMotion(activeMotionResult ?? undefined)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                            fontSize: '13px', fontWeight: 600, background: '#0f172a', color: '#fff',
                            border: 'none', borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Download
                        </button>
                      )}
                    </form>
                    {/* Generate Now — skip remaining questions */}
                    {motionGenStep !== 'done' && motionConversation.length >= 2 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button
                          onClick={handleGenerateNow}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 20px', fontSize: '13px', fontWeight: 600,
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.2)'; }}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Now — skip remaining questions
                        </button>
                      </div>
                    )}
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
                {/* Orchestrator section */}
                <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Orchestrator</div>
                  <select value={orchestrator} onChange={(e) => setOrchestrator(e.target.value as 'lern-2.1' | 'lern-1.9')} style={{
                    width: '100%', padding: '9px 12px', border: `1.5px solid ${PROVIDER_INFO[orchestrator]?.color || '#0d9488'}40`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: PROVIDER_INFO[orchestrator]?.bg || '#f0fdfa', cursor: 'pointer',
                    color: PROVIDER_INFO[orchestrator]?.color || '#0d9488',
                  }}>
                    <option value="lern-2.1">LERN 2.1 Beta</option>
                    <option value="lern-1.9">LERN 1.9.1 Stable</option>
                  </select>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                    AI-powered drafting and enhancement engine
                  </div>
                </div>

                {/* Documents section */}
                <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', background: '#fff' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Documents</div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#0d9488'; }}
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
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Drop files or <span style={{ color: '#0d9488', fontWeight: 600 }}>browse</span></div>
                  </div>
                  {motionDocs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                      {motionDocs.map(doc => {
                        const sel = motionSelectedDocs.includes(doc.id);
                        return (
                          <button key={doc.id} onClick={() => setMotionSelectedDocs(prev => sel ? prev.filter(id => id !== doc.id) : [...prev, doc.id])} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: sel ? '#f0fdfa' : '#f9fafb',
                            border: `1.5px solid ${sel ? '#0d9488' : '#e5e7eb'}`, borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px',
                          }}>
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                              border: `2px solid ${sel ? '#0d9488' : '#d1d5db'}`, background: sel ? '#0d9488' : '#fff',
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
                    <button onClick={() => openCanLII()} style={{ padding: '7px 12px', fontSize: '11px', fontWeight: 600, background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
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
                        style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 500, background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: '10px', cursor: 'pointer' }}>
                        {link.label}
                      </button>
                    ))}
                  </div>
                  {/* Referenced cases from result */}
                  {activeMotionResult?.key_case_law && activeMotionResult.key_case_law.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#0f766e', marginBottom: '4px' }}>Cited cases:</div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {activeMotionResult.key_case_law.slice(0, 5).map((c, i) => (
                          <button key={i} onClick={() => openCanLII(c.case)} style={{
                            padding: '2px 6px', fontSize: '10px', fontWeight: 500, background: '#f0fdfa', color: '#0f766e',
                            border: '1px solid #99f6e4', borderRadius: '4px', cursor: 'pointer',
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
                        background: showAddToCase ? '#f0fdfa' : '#f9fafb', color: showAddToCase ? '#0d9488' : '#374151',
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
                            style={{ padding: '7px 12px', fontSize: '11px', fontWeight: 600, background: caseOrPersonName.trim() ? '#0d9488' : '#e5e7eb', color: caseOrPersonName.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
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
            style={{ width: '100%' }}
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
                      background: '#faf5ff',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#7c3aed',
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
                        Enhanced
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
                    background: '#f5f3ff',
                    border: '1px solid #ede9fe',
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#7c3aed',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#7c3aed',
                    }}>
                      {conversationStep === 'gemini_loading' ? 'Analyzing...' : 'Processing...'}
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
                    background: '#faf5ff',
                    borderRadius: '12px',
                    padding: '20px',
                  } : {}}>
                    {conversationStep === 'gpt_streaming' && (
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#7c3aed',
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
                        Enhancing...
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
                    Provide feedback to enhance the response
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
                        Enhance
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

      </div>
    </div>
  );
};
