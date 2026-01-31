import { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../../../api/client';

interface MotionResult {
  success: boolean;
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
}

interface MotionDrafterTabProps {
  dataSourceId?: number;
  initialIntent?: string;
}

const MOTION_TYPES = [
  { id: 'charter_s8', label: 'Charter s.8 - Illegal Search & Seizure', description: 'Motion to exclude evidence obtained through unreasonable search' },
  { id: 'disclosure', label: 'Disclosure Application', description: 'Request for Crown disclosure under Stinchcombe' },
  { id: 'stay_of_proceedings', label: 'Stay of Proceedings', description: 'Motion to stay charges due to abuse of process' },
];

export const MotionDrafterTab = ({ dataSourceId, initialIntent }: MotionDrafterTabProps) => {
  const [selectedMotion, setSelectedMotion] = useState('charter_s8');
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
  const [result, setResult] = useState<MotionResult | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.post('/api/ai-tools/generate_motion/', {
        motion_type: selectedMotion,
        case_details: caseDetails,
        case_description: caseDescription,
        data_source_id: dataSourceId,
      });
      setResult(response.data.result);
      setShowForm(false);
    } catch (error) {
      console.error('Error generating motion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowForm(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getFullMotionText = () => {
    if (!result?.motion) return result?.raw_motion || '';
    const m = result.motion;
    return `${m.header || ''}\n\n${m.title || ''}\n\n${m.introduction || ''}\n\nRELIEF SOUGHT:\n${(m.relief_sought || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nGROUNDS:\n${(m.grounds || []).map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\nFACTUAL BACKGROUND:\n${m.factual_background || ''}\n\nLEGAL ARGUMENT:\n${m.legal_argument?.charter_violation || ''}\n\n${m.conclusion || ''}\n\n${m.signature_block || ''}`;
  };

  if (!showForm && result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: '8px 0' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Generated Motion
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              {MOTION_TYPES.find(m => m.id === selectedMotion)?.label}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copyToClipboard(getFullMotionText())}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📋 Copy All
            </button>
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
              ← Draft Another
            </button>
          </div>
        </div>

        {/* Risk Assessment */}
        {result.risk_assessment && (
          <div style={{
            padding: '16px',
            background: result.risk_assessment.strength === 'strong' ? '#f0fdf4' : result.risk_assessment.strength === 'moderate' ? '#fffbeb' : '#fef2f2',
            borderRadius: '12px',
            marginBottom: '20px',
            borderLeft: `4px solid ${result.risk_assessment.strength === 'strong' ? '#16a34a' : result.risk_assessment.strength === 'moderate' ? '#d97706' : '#dc2626'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚖️</span>
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
        {result.motion ? (
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
                  {result.motion.relief_sought.map((item, i) => (
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
                  {result.motion.grounds.map((item, i) => (
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
        ) : result.raw_motion && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>
              {result.raw_motion}
            </pre>
          </div>
        )}

        {/* Key Case Law */}
        {result.key_case_law && result.key_case_law.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
              📚 Key Case Law
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.key_case_law.map((c, i) => (
                <div key={i} style={{ padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#7c3aed' }}>{c.case}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{c.relevance}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence to Gather */}
        {result.evidence_to_gather && result.evidence_to_gather.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
              🔍 Additional Evidence to Gather
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {result.evidence_to_gather.map((e, i) => (
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
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
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

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || (!caseDescription.trim() && !caseDetails.client_name)}
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
            Drafting Motion...
          </span>
        ) : (
          '⚖️ Generate Motion'
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
