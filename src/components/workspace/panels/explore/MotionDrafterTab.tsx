import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../../../api/client';
import { datasetsApi } from '../../../../api/endpoints/datasets';
import { ModelSelector, type Provider } from './ModelSelector';

type WorkflowMode = 'parallel' | 'refine';

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
  risk_assessment?: {
    strength?: string;
    explanation?: string;
  };
  raw_motion?: string;
  refinement_notes?: string;
  improvements_made?: string[];
}

interface MotionResults {
  claude?: MotionResult;
  gemini?: MotionResult;
  gpt4?: MotionResult;
}

interface DocumentRef {
  id: number;
  name: string;
  type: string;
}

interface MotionDrafterTabProps {
  dataSourceId?: number;
  initialIntent?: string;
  availableDocuments?: DocumentRef[];
}

const MOTION_TYPES = [
  { id: 'charter_s8', label: 'Charter s.8 - Illegal Search & Seizure', description: 'Motion to exclude evidence obtained through unreasonable search' },
  { id: 'disclosure', label: 'Disclosure Application', description: 'Request for Crown disclosure under Stinchcombe' },
  { id: 'stay_of_proceedings', label: 'Stay of Proceedings', description: 'Motion to stay charges due to abuse of process' },
];

export const MotionDrafterTab = ({ dataSourceId, initialIntent, availableDocuments = [] }: MotionDrafterTabProps) => {
  const [selectedMotion, setSelectedMotion] = useState('charter_s8');
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('parallel');
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(['claude', 'gemini', 'gpt4']);
  const [creatorProvider, setCreatorProvider] = useState<Provider>('gemini');
  const [refinerProvider, setRefinerProvider] = useState<Provider>('claude');
  const [caseDetails, setCaseDetails] = useState({
    client_name: '',
    court_file_no: '',
    court_location: '',
    charges: '',
    date_of_incident: '',
    arresting_officer: '',
  });
  const [caseDescription, setCaseDescription] = useState(initialIntent || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<MotionResults | null>(null);
  const [refineResults, setRefineResults] = useState<{ initial: MotionResult; refined: MotionResult } | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [referenceDocIds, setReferenceDocIds] = useState<number[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<Provider | 'initial' | 'refined'>('claude');
  const [generationStep, setGenerationStep] = useState<'idle' | 'creating' | 'refining' | 'done'>('idle');
  const [stepProgress, setStepProgress] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);

  // Document library state
  const [allDocuments, setAllDocuments] = useState<DocumentRef[]>(availableDocuments);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all documents on mount
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const response = await datasetsApi.list();
      const docs = (response.results || []).map((ds: { id: number; name: string; type?: string }) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type || 'file',
      }));
      setAllDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${file.name}${files.length > 1 ? ` (${i + 1}/${files.length})` : ''}...`);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const typeMap: Record<string, string> = {
          pdf: 'pdf', doc: 'doc', docx: 'docx', txt: 'txt', md: 'md',
          csv: 'csv', xlsx: 'excel', xls: 'excel', json: 'json',
        };
        await datasetsApi.create({
          name: file.name,
          type: typeMap[ext] || ext,
          file: file,
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setUploadProgress('');
    setIsUploading(false);
    await fetchDocuments();

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleDocReference = (docId: number) => {
    setReferenceDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('creating');
    setStepProgress(0);
    setStepElapsed(0);
    setShowForm(false);

    // Start elapsed timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setStepElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 3 + 0.5;
      if (progress > 90) progress = 90; // Cap at 90% until actually done
      setStepProgress(progress);
    }, 500);

    try {
      if (workflowMode === 'refine') {
        // === Step 1: Create initial draft ===
        setGenerationStep('creating');
        const createResponse = await apiClient.post('/ai-tools/generate_motion/', {
          motion_type: selectedMotion,
          case_details: caseDetails,
          case_description: caseDescription,
          data_source_id: dataSourceId,
          reference_document_ids: referenceDocIds,
          providers: [creatorProvider],
        });

        const initialDraft = createResponse.data.results?.[creatorProvider];
        if (!initialDraft?.success) {
          throw new Error(`Failed to create draft with ${creatorProvider}`);
        }

        // Show step 1 complete
        setStepProgress(100);
        setRefineResults({ initial: initialDraft, refined: initialDraft });

        // Brief pause to show step 1 completion
        await new Promise(resolve => setTimeout(resolve, 800));

        // === Step 2: Refine with second model ===
        setGenerationStep('refining');
        setStepProgress(0);
        progress = 0;
        const refineStartTime = Date.now();
        setStepElapsed(0);
        clearInterval(timerInterval);
        const timerInterval2 = setInterval(() => {
          setStepElapsed(Math.floor((Date.now() - refineStartTime) / 1000));
        }, 1000);

        const refineResponse = await apiClient.post('/ai-tools/refine_draft/', {
          motion_type: selectedMotion,
          case_details: caseDetails,
          case_description: caseDescription,
          original_motion: initialDraft,
          refiner_provider: refinerProvider,
        });

        clearInterval(timerInterval2);

        if (refineResponse.data.success) {
          setRefineResults({
            initial: initialDraft,
            refined: refineResponse.data.refined_result,
          });
        } else {
          // If refine fails, keep the initial draft
          setRefineResults({ initial: initialDraft, refined: initialDraft });
        }

        setStepProgress(100);
        setGenerationStep('done');
        setActiveResultTab('refined');
      } else {
        // Parallel comparison workflow (single call)
        const response = await apiClient.post('/ai-tools/generate_motion/', {
          motion_type: selectedMotion,
          case_details: caseDetails,
          case_description: caseDescription,
          data_source_id: dataSourceId,
          reference_document_ids: referenceDocIds,
          providers: selectedProviders,
        });
        setResults(response.data.results);
        setActiveResultTab(selectedProviders[0]);
        setStepProgress(100);
        setGenerationStep('done');
      }
    } catch (error) {
      console.error('Error generating motion:', error);
      setGenerationStep('idle');
      if (!results && !refineResults) setShowForm(true);
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setRefineResults(null);
    setShowForm(true);
    setGenerationStep('idle');
    setStepProgress(0);
    setStepElapsed(0);
  };

  const [showAddToCase, setShowAddToCase] = useState(false);
  const [caseOrPersonName, setCaseOrPersonName] = useState('');
  const [addToCaseSaved, setAddToCaseSaved] = useState(false);
  const [showCanLII, setShowCanLII] = useState(false);
  const [canLIIQuery, setCanLIIQuery] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getFullMotionText = (result: MotionResult | undefined) => {
    if (!result?.motion) return result?.raw_motion || '';
    const m = result.motion;
    return `${m.header || ''}\n\n${m.title || ''}\n\n${m.introduction || ''}\n\nRELIEF SOUGHT:\n${(m.relief_sought || []).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}\n\nGROUNDS:\n${(m.grounds || []).map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}\n\nFACTUAL BACKGROUND:\n${m.factual_background || ''}\n\nLEGAL ARGUMENT:\n${m.legal_argument?.charter_violation || ''}\n\n${m.conclusion || ''}\n\n${m.signature_block || ''}`;
  };

  const handleDownloadMotion = (result: MotionResult | undefined) => {
    const text = getFullMotionText(result);
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const motionLabel = MOTION_TYPES.find(m => m.id === selectedMotion)?.label || 'Motion';
    const clientName = caseDetails.client_name || 'Client';
    a.href = url;
    a.download = `${motionLabel} - ${clientName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToCase = () => {
    // In production this would save to a cases/persons DB
    // For now, show confirmation UX
    setAddToCaseSaved(true);
    setTimeout(() => setAddToCaseSaved(false), 3000);
    setShowAddToCase(false);
    setCaseOrPersonName('');
  };

  const openCanLII = (query?: string) => {
    const searchTerm = query || canLIIQuery;
    if (searchTerm) {
      window.open(`https://www.canlii.org/en/#search/type=decision&text=${encodeURIComponent(searchTerm)}`, '_blank');
    } else {
      window.open('https://www.canlii.org/en/on/', '_blank');
    }
  };

  const activeResult = (activeResultTab !== 'initial' && activeResultTab !== 'refined') ? results?.[activeResultTab] : undefined;

  const PROVIDER_INFO: Record<string, { name: string; color: string; bg: string }> = {
    claude: { name: 'Claude', color: '#D97706', bg: '#FEF3C7' },
    gemini: { name: 'Gemini', color: '#2563EB', bg: '#DBEAFE' },
    gpt4: { name: 'GPT-5.2', color: '#10B981', bg: '#D1FAE5' },
  };

  // Get providers that have results
  const availableResults = (['claude', 'gemini', 'gpt4'] as Provider[]).filter(p => results?.[p]);

  // For refine workflow, get the active result
  const getRefineResult = (): MotionResult | undefined => {
    if (!refineResults) return undefined;
    return activeResultTab === 'initial' ? refineResults.initial : refineResults.refined;
  };

  // Progress stepper during generation
  if (!showForm && isGenerating && generationStep !== 'done') {
    const isRefineMode = workflowMode === 'refine';
    const steps = isRefineMode
      ? [
          { key: 'creating', label: `Creating draft with ${PROVIDER_INFO[creatorProvider].name}`, provider: creatorProvider },
          { key: 'refining', label: `Refining with ${PROVIDER_INFO[refinerProvider].name}`, provider: refinerProvider },
        ]
      : [
          { key: 'creating', label: `Generating with ${selectedProviders.map(p => PROVIDER_INFO[p].name).join(', ')}`, provider: selectedProviders[0] },
        ];

    const currentStepIndex = steps.findIndex(s => s.key === generationStep);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '40px 20px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
            {isRefineMode ? 'Create & Refine Workflow' : 'Generating Motion'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {MOTION_TYPES.find(m => m.id === selectedMotion)?.label}
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isComplete = idx < currentStepIndex;
            const isPending = idx > currentStepIndex;
            const providerColor = PROVIDER_INFO[step.provider]?.color || '#6b7280';

            return (
              <div key={step.key}>
                {/* Step row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Step circle */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                    background: isComplete ? '#16a34a' : isActive ? providerColor : '#e5e7eb',
                    color: isComplete || isActive ? '#fff' : '#9ca3af',
                    boxShadow: isActive ? `0 0 0 4px ${providerColor}25` : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {isComplete ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step label */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: isPending ? '#9ca3af' : '#111827',
                    }}>
                      Step {idx + 1}: {isComplete ? 'Complete' : step.label}
                    </div>
                    {isActive && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {stepElapsed}s elapsed...
                      </div>
                    )}
                  </div>

                  {/* Spinner for active step */}
                  {isActive && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: `2.5px solid ${providerColor}30`,
                      borderTopColor: providerColor,
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                  )}
                </div>

                {/* Progress bar for active step */}
                {isActive && (
                  <div style={{
                    marginTop: '10px',
                    marginLeft: '54px',
                    height: '4px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(stepProgress, 95)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${providerColor}, ${providerColor}cc)`,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                )}

                {/* Connector line between steps */}
                {idx < steps.length - 1 && (
                  <div style={{
                    width: '2px',
                    height: '16px',
                    background: isComplete ? '#16a34a' : '#e5e7eb',
                    marginLeft: '19px',
                    marginTop: '4px',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Pulsing animation at bottom */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '13px', color: '#9ca3af' }}
          >
            {generationStep === 'creating' ? 'Analyzing case and drafting motion...' : 'Reviewing and strengthening arguments...'}
          </motion.div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    );
  }

  if (!showForm && (results || refineResults)) {
    const isRefineWorkflow = workflowMode === 'refine' && refineResults;
    const hasMultipleResults = isRefineWorkflow ? true : availableResults.length > 1;
    const result = isRefineWorkflow ? getRefineResult() : activeResult;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: '8px 0' }}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Generated Motion
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {MOTION_TYPES.find(m => m.id === selectedMotion)?.label}
              </p>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: '#0d9488',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Draft Another
            </button>
          </div>

          {/* Action bar */}
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '10px 12px',
            background: '#f9fafb',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
          }}>
            {/* Copy */}
            <button
              onClick={() => copyToClipboard(getFullMotionText(result))}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', fontSize: '12px', fontWeight: 500,
                background: '#fff', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>

            {/* Download */}
            <button
              onClick={() => handleDownloadMotion(result)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', fontSize: '12px', fontWeight: 500,
                background: '#fff', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download
            </button>

            {/* Add to Case/Person */}
            <button
              onClick={() => setShowAddToCase(!showAddToCase)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', fontSize: '12px', fontWeight: 500,
                background: showAddToCase ? '#eff6ff' : '#fff',
                color: showAddToCase ? '#2563eb' : '#374151',
                border: `1px solid ${showAddToCase ? '#93c5fd' : '#e5e7eb'}`,
                borderRadius: '6px', cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add to Case
            </button>

            {/* CanLII Lookup */}
            <button
              onClick={() => setShowCanLII(!showCanLII)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                background: showCanLII ? '#fef3c7' : '#fff',
                color: showCanLII ? '#92400e' : '#374151',
                border: `1px solid ${showCanLII ? '#fcd34d' : '#e5e7eb'}`,
                borderRadius: '6px', cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              CanLII
            </button>
          </div>

          {/* Saved confirmation */}
          {addToCaseSaved && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '8px', padding: '10px 14px',
                background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0',
                fontSize: '13px', color: '#166534', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Motion saved to case file
            </motion.div>
          )}

          {/* Add to Case dropdown */}
          {showAddToCase && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '8px', padding: '14px',
                background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Save to Case or Person
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={caseOrPersonName}
                  onChange={(e) => setCaseOrPersonName(e.target.value)}
                  placeholder="Case name or person (e.g., R. v. Smith, File #2024-1234)"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: '13px',
                    border: '1px solid #e5e7eb', borderRadius: '6px',
                  }}
                />
                <button
                  onClick={handleAddToCase}
                  disabled={!caseOrPersonName.trim()}
                  style={{
                    padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                    background: caseOrPersonName.trim() ? '#2563eb' : '#e5e7eb',
                    color: caseOrPersonName.trim() ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Save
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                This will associate the motion with the specified case for future reference
              </div>
            </motion.div>
          )}

          {/* CanLII Search Panel */}
          {showCanLII && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '8px', padding: '14px',
                background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                Canadian Legal Information Institute
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={canLIIQuery}
                  onChange={(e) => setCanLIIQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && openCanLII()}
                  placeholder="Search case law (e.g., R. v. Grant, Charter s.8)"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: '13px',
                    border: '1px solid #fcd34d', borderRadius: '6px', background: '#fff',
                  }}
                />
                <button
                  onClick={() => openCanLII()}
                  style={{
                    padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                    background: '#d97706', color: '#fff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Search
                </button>
              </div>
              {/* Quick links for common references */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Criminal Code', query: 'Criminal Code RSC 1985 c C-46' },
                  { label: 'Charter', query: 'Canadian Charter of Rights and Freedoms' },
                  { label: 'CDSA', query: 'Controlled Drugs and Substances Act' },
                  { label: 'Ontario Courts', query: '' },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => link.query ? openCanLII(link.query) : window.open('https://www.canlii.org/en/on/', '_blank')}
                    style={{
                      padding: '4px 10px', fontSize: '11px', fontWeight: 500,
                      background: '#fff', color: '#92400e',
                      border: '1px solid #fcd34d', borderRadius: '12px', cursor: 'pointer',
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              {/* Auto-suggest from case law in the motion */}
              {result?.key_case_law && result.key_case_law.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '6px' }}>
                    Cases referenced in this motion:
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {result.key_case_law.map((c: { case: string; relevance: string }, i: number) => (
                      <button
                        key={i}
                        onClick={() => openCanLII(c.case)}
                        style={{
                          padding: '3px 8px', fontSize: '11px', fontWeight: 500,
                          background: '#fef3c7', color: '#78350f',
                          border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer',
                        }}
                        title={c.relevance}
                      >
                        {c.case}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Provider Tabs / Workflow Tabs */}
        {hasMultipleResults && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            padding: '4px',
            background: '#f3f4f6',
            borderRadius: '10px',
          }}>
            {isRefineWorkflow ? (
              // Create & Refine workflow tabs
              <>
                <button
                  onClick={() => setActiveResultTab('initial')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: activeResultTab === 'initial' ? '#fff' : 'transparent',
                    color: activeResultTab === 'initial' ? PROVIDER_INFO[creatorProvider].color : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: activeResultTab === 'initial' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: PROVIDER_INFO[creatorProvider].color,
                  }} />
                  Initial ({PROVIDER_INFO[creatorProvider].name})
                </button>
                <button
                  onClick={() => setActiveResultTab('refined')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: activeResultTab === 'refined' ? '#fff' : 'transparent',
                    color: activeResultTab === 'refined' ? PROVIDER_INFO[refinerProvider].color : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: activeResultTab === 'refined' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: PROVIDER_INFO[refinerProvider].color,
                  }} />
                  Refined ({PROVIDER_INFO[refinerProvider].name})
                </button>
              </>
            ) : (
              // Parallel comparison tabs
              availableResults.map((provider) => {
                const info = PROVIDER_INFO[provider];
                const isActive = activeResultTab === provider;
                return (
                  <button
                    key={provider}
                    onClick={() => setActiveResultTab(provider)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: isActive ? '#fff' : 'transparent',
                      color: isActive ? info.color : '#6b7280',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: info.color,
                    }} />
                    {info.name}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Refinement Notes - show for refined result */}
        {isRefineWorkflow && activeResultTab === 'refined' && refineResults?.refined?.refinement_notes && (
          <div style={{
            padding: '12px 16px',
            background: '#f0fdf4',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid #bbf7d0',
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
              Refinement Notes
            </div>
            <p style={{ fontSize: '13px', color: '#15803d', margin: 0, lineHeight: 1.5 }}>
              {refineResults.refined.refinement_notes}
            </p>
          </div>
        )}

        {/* Improvements Made - show for refined result */}
        {isRefineWorkflow && activeResultTab === 'refined' && refineResults?.refined?.improvements_made && (
          <div style={{
            padding: '12px 16px',
            background: '#eff6ff',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid #bfdbfe',
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>
              Improvements Made
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {refineResults.refined.improvements_made.map((improvement: string, i: number) => (
                <li key={i} style={{ fontSize: '13px', color: '#1d4ed8', marginBottom: '4px' }}>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Assessment */}
        {result?.risk_assessment && (
          <div style={{
            padding: '16px',
            background: result.risk_assessment.strength === 'strong' ? '#f0fdf4' : result.risk_assessment.strength === 'moderate' ? '#fffbeb' : '#fef2f2',
            borderRadius: '12px',
            marginBottom: '20px',
            borderLeft: `4px solid ${result.risk_assessment.strength === 'strong' ? '#16a34a' : result.risk_assessment.strength === 'moderate' ? '#d97706' : '#dc2626'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>Motion Strength: </span>
              <span style={{
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: result.risk_assessment.strength === 'strong' ? '#dcfce7' : result.risk_assessment.strength === 'moderate' ? '#fef3c7' : '#fecaca',
                color: result.risk_assessment.strength === 'strong' ? '#166534' : result.risk_assessment.strength === 'moderate' ? '#92400e' : '#dc2626',
              }}>
                {result.risk_assessment.strength}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
              {result.risk_assessment.explanation}
            </p>
          </div>
        )}

        {/* Motion Content */}
        {result?.motion ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Court Header */}
            {result.motion.header && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>
                  {result.motion.header}
                </pre>
              </div>
            )}

            {/* Title & Introduction */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0', textAlign: 'center' }}>
                {result.motion.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                {result.motion.introduction}
              </p>
            </div>

            {/* Relief Sought */}
            {result.motion.relief_sought && result.motion.relief_sought.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                  RELIEF SOUGHT
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {result.motion.relief_sought.map((item: string, i: number) => (
                    <li key={i} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '8px' }}>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Grounds */}
            {result.motion.grounds && result.motion.grounds.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                  GROUNDS
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {result.motion.grounds.map((item: string, i: number) => (
                    <li key={i} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '8px' }}>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Factual Background */}
            {result.motion.factual_background && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                  FACTUAL BACKGROUND
                </h4>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {result.motion.factual_background}
                </p>
              </div>
            )}

            {/* Legal Argument */}
            {result.motion.legal_argument && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                  LEGAL ARGUMENT
                </h4>

                {result.motion.legal_argument.charter_violation && (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', margin: '0 0 8px 0' }}>
                      Charter Violation
                    </h5>
                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                      {result.motion.legal_argument.charter_violation}
                    </p>
                  </div>
                )}

                {result.motion.legal_argument.grant_analysis && (
                  <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginTop: '12px' }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                      Grant Framework Analysis
                    </h5>

                    {result.motion.legal_argument.grant_analysis.seriousness_of_breach && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>1. Seriousness of Breach:</span>
                        <p style={{ fontSize: '13px', color: '#374151', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                          {result.motion.legal_argument.grant_analysis.seriousness_of_breach}
                        </p>
                      </div>
                    )}

                    {result.motion.legal_argument.grant_analysis.impact_on_accused && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>2. Impact on Accused:</span>
                        <p style={{ fontSize: '13px', color: '#374151', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                          {result.motion.legal_argument.grant_analysis.impact_on_accused}
                        </p>
                      </div>
                    )}

                    {result.motion.legal_argument.grant_analysis.society_interest && (
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>3. Society's Interest:</span>
                        <p style={{ fontSize: '13px', color: '#374151', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                          {result.motion.legal_argument.grant_analysis.society_interest}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Conclusion */}
            {result.motion.conclusion && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                  CONCLUSION
                </h4>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  {result.motion.conclusion}
                </p>
              </div>
            )}
          </div>
        ) : result?.raw_motion && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>
              {result?.raw_motion}
            </pre>
          </div>
        )}

        {/* Key Case Law */}
        {result?.key_case_law && result.key_case_law.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
              Key Case Law
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.key_case_law.map((c: { case: string; relevance: string }, i: number) => (
                <div key={i} style={{ padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#7c3aed' }}>{c.case}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{c.relevance}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence to Gather */}
        {result?.evidence_to_gather && result.evidence_to_gather.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
              Additional Evidence to Gather
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {result.evidence_to_gather.map((e: string, i: number) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '8px 0' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
          Legal Motion Drafter
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Draft Canadian legal motions powered by AI
        </p>
      </div>

      {/* Motion Type Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Motion Type
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MOTION_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedMotion(type.id)}
              style={{
                padding: '14px 16px',
                background: selectedMotion === type.id ? '#f0fdf4' : '#fff',
                border: `2px solid ${selectedMotion === type.id ? '#16a34a' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{type.label}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Case Details Form */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
          Case Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Client Name
            </label>
            <input
              type="text"
              value={caseDetails.client_name}
              onChange={(e) => setCaseDetails({ ...caseDetails, client_name: e.target.value })}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Court File Number
            </label>
            <input
              type="text"
              value={caseDetails.court_file_no}
              onChange={(e) => setCaseDetails({ ...caseDetails, court_file_no: e.target.value })}
              placeholder="CR-2024-12345"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Court Location
            </label>
            <input
              type="text"
              value={caseDetails.court_location}
              onChange={(e) => setCaseDetails({ ...caseDetails, court_location: e.target.value })}
              placeholder="Ontario Superior Court of Justice, Toronto"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Date of Incident
            </label>
            <input
              type="text"
              value={caseDetails.date_of_incident}
              onChange={(e) => setCaseDetails({ ...caseDetails, date_of_incident: e.target.value })}
              placeholder="January 15, 2024"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Charges
            </label>
            <input
              type="text"
              value={caseDetails.charges}
              onChange={(e) => setCaseDetails({ ...caseDetails, charges: e.target.value })}
              placeholder="Possession of controlled substance contrary to s.4(1) CDSA"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
              Arresting Officer
            </label>
            <input
              type="text"
              value={caseDetails.arresting_officer}
              onChange={(e) => setCaseDetails({ ...caseDetails, arresting_officer: e.target.value })}
              placeholder="Cst. Smith #1234"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Case Description */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
          Describe What Happened
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>
          Write out the facts of the case - what happened, how the search was conducted, any issues with the arrest, etc.
        </p>
        <textarea
          value={caseDescription}
          onChange={(e) => setCaseDescription(e.target.value)}
          placeholder="On January 15, 2024, my client was stopped while walking on Main Street. The officer stated they smelled marijuana and proceeded to search my client's pockets without obtaining consent or providing grounds for the search. The officer found a small quantity of cannabis in the jacket pocket. My client was not informed of their right to counsel before the search..."
          rows={8}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Reference Documents & Upload */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Reference Documents
          </h3>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Optional</span>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 14px 0' }}>
          Upload or select documents the AI should reference (Crown's factum, disclosure, police notes, prior decisions)
        </p>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#7c3aed'; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#d1d5db'; handleFileUpload(e.dataTransfer.files); }}
          style={{
            border: '2px dashed #d1d5db',
            borderRadius: '10px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '14px',
            transition: 'border-color 0.2s',
            cursor: 'pointer',
            background: '#fafafa',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          {isUploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid #e5e7eb', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 500 }}>{uploadProgress}</span>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Drop files here or <span style={{ color: '#7c3aed', fontWeight: 600 }}>browse</span>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                PDF, Word, Text, CSV, Excel
              </div>
            </>
          )}
        </div>

        {/* Document list */}
        {isLoadingDocs ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '8px' }}>
            Loading documents...
          </div>
        ) : allDocuments.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '8px' }}>
            No documents uploaded yet. Upload files above to reference them.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {allDocuments.map((doc) => {
              const isSelected = referenceDocIds.includes(doc.id);
              const typeColors: Record<string, string> = {
                pdf: '#dc2626', doc: '#2563eb', docx: '#2563eb', txt: '#6b7280',
                csv: '#16a34a', excel: '#16a34a', md: '#7c3aed',
              };
              const dotColor = typeColors[doc.type] || '#9ca3af';

              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDocReference(doc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: isSelected ? '#f5f3ff' : '#f9fafb',
                    border: `1.5px solid ${isSelected ? '#7c3aed' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#7c3aed' : '#d1d5db'}`,
                    background: isSelected ? '#7c3aed' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Type dot */}
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0,
                  }} />

                  {/* Name */}
                  <span style={{
                    flex: 1, fontSize: '13px', fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#111827' : '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {doc.name}
                  </span>

                  {/* Type badge */}
                  <span style={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: '4px',
                    background: `${dotColor}15`, color: dotColor,
                  }}>
                    {doc.type}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected count */}
        {referenceDocIds.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: '#f5f3ff',
            borderRadius: '8px',
            border: '1px solid #ddd6fe',
            fontSize: '13px',
            color: '#5b21b6',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {referenceDocIds.length} document{referenceDocIds.length > 1 ? 's' : ''} selected for reference
          </div>
        )}
      </div>

      {/* Workflow Mode Selection */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
          Generation Mode
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setWorkflowMode('parallel')}
            disabled={isGenerating}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: workflowMode === 'parallel' ? '#f0fdf4' : '#fff',
              border: `2px solid ${workflowMode === 'parallel' ? '#16a34a' : '#e5e7eb'}`,
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: isGenerating ? 0.6 : 1,
            }}
          >
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>Compare Models</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Generate with multiple AIs side-by-side</div>
          </button>
          <button
            onClick={() => setWorkflowMode('refine')}
            disabled={isGenerating}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: workflowMode === 'refine' ? '#eff6ff' : '#fff',
              border: `2px solid ${workflowMode === 'refine' ? '#2563eb' : '#e5e7eb'}`,
              borderRadius: '10px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: isGenerating ? 0.6 : 1,
            }}
          >
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>Create and Refine</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Draft with one AI, refine with another</div>
          </button>
        </div>
      </div>

      {/* Model Selection - changes based on workflow mode */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        {workflowMode === 'parallel' ? (
          <>
            <ModelSelector
              selectedProviders={selectedProviders}
              onSelectionChange={setSelectedProviders}
              disabled={isGenerating}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>
              {selectedProviders.length >= 2 ? `Generate motions from ${selectedProviders.length} models for comparison` :
               selectedProviders.length === 1 ? `Generate motion using ${PROVIDER_INFO[selectedProviders[0]]?.name}` :
               'Select at least one model'}
            </p>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
              Select AI Models
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '12px', alignItems: 'center' }}>
              {/* Creator Model */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                  Create Draft With
                </label>
                <select
                  value={creatorProvider}
                  onChange={(e) => setCreatorProvider(e.target.value as Provider)}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `2px solid ${PROVIDER_INFO[creatorProvider].color}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: PROVIDER_INFO[creatorProvider].bg,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    color: '#111827',
                  }}
                >
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="gpt4">GPT-5.2</option>
                </select>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '20px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Refiner Model */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                  Refine With
                </label>
                <select
                  value={refinerProvider}
                  onChange={(e) => setRefinerProvider(e.target.value as Provider)}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `2px solid ${PROVIDER_INFO[refinerProvider].color}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: PROVIDER_INFO[refinerProvider].bg,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    color: '#111827',
                  }}
                >
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="gpt4">GPT-5.2</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '12px 0 0 0' }}>
              {PROVIDER_INFO[creatorProvider].name} will create the initial draft, then {PROVIDER_INFO[refinerProvider].name} will review and strengthen it
            </p>
          </>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || (!caseDescription.trim() && !caseDetails.client_name) || (workflowMode === 'parallel' && selectedProviders.length === 0)}
        style={{
          width: '100%',
          padding: '14px 24px',
          fontSize: '15px',
          fontWeight: 600,
          color: '#fff',
          background: isGenerating ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #6366f1)',
          border: 'none',
          borderRadius: '10px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }}
      >
        {isGenerating ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            {generationStep === 'creating' ? `Creating draft with ${PROVIDER_INFO[creatorProvider].name}...` :
             generationStep === 'refining' ? `Refining with ${PROVIDER_INFO[refinerProvider].name}...` :
             'Drafting Motion...'}
          </span>
        ) : workflowMode === 'refine' ? (
          `Create with ${PROVIDER_INFO[creatorProvider].name} and Refine with ${PROVIDER_INFO[refinerProvider].name}`
        ) : (
          'Generate Motion'
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};
