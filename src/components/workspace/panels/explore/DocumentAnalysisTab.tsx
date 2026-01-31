import { motion } from 'framer-motion';

interface DocumentAnalysis {
  success: boolean;
  provider?: string;
  document_type?: string;
  document_classification?: string;
  executive_summary?: string;
  parties_involved?: Array<{
    name: string;
    role: string;
    obligations: string[];
  }>;
  key_terms?: Array<{
    term: string;
    description: string;
    location?: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  important_dates?: Array<{
    date: string;
    significance: string;
    action_required?: string;
  }>;
  financial_terms?: Array<{
    description: string;
    amount?: string;
    frequency?: string;
    conditions?: string;
  }>;
  risks_and_concerns?: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    affected_party?: string;
    recommendation?: string;
  }>;
  unusual_clauses?: Array<{
    clause: string;
    why_unusual: string;
    potential_impact?: string;
  }>;
  missing_elements?: string[];
  action_items?: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    responsible_party?: string;
    deadline?: string;
  }>;
  legal_compliance?: {
    appears_compliant: boolean;
    potential_issues?: string[];
    jurisdictional_notes?: string;
  };
  recommendations?: string[];
  questions_to_clarify?: string[];
  raw_analysis?: string;
  error?: string;
}

interface DocumentAnalysisTabProps {
  analysis: { claude?: DocumentAnalysis; gemini?: DocumentAnalysis } | null;
  documentName: string;
  documentType: string;
  documentUrl?: string;
  onRunAnalysis: () => void;
  isProcessing: boolean;
}

const PROVIDER_INFO = {
  claude: { name: 'Claude', color: '#D97706', bg: '#FEF3C7', icon: '🧠', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)' },
  gemini: { name: 'Gemini', color: '#2563EB', bg: '#DBEAFE', icon: '✨', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)' },
};

const SeverityBadge = ({ severity }: { severity: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    low: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };
  const c = colors[severity];
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div style={{
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    marginBottom: '12px',
  }}>
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
    </div>
    <div style={{ padding: '12px' }}>
      {children}
    </div>
  </div>
);

// Single provider analysis panel
const AnalysisPanel = ({ data, provider }: { data: DocumentAnalysis | undefined; provider: 'claude' | 'gemini' }) => {
  const info = PROVIDER_INFO[provider];

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>{info.icon}</div>
        <p style={{ fontSize: '14px', margin: 0 }}>No {info.name} analysis yet</p>
      </div>
    );
  }

  if (!data.success) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        <p>Analysis failed: {data.error || 'Unknown error'}</p>
      </div>
    );
  }

  if (data.raw_analysis) {
    return (
      <Section title="Analysis Result" icon="📝">
        <pre style={{
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
          lineHeight: 1.5,
          color: '#374151',
          margin: 0,
        }}>
          {data.raw_analysis}
        </pre>
      </Section>
    );
  }

  return (
    <div>
      {/* Document Type & Summary */}
      <Section title="Overview" icon="📋">
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '14px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#ede9fe',
            color: '#7c3aed',
          }}>
            {data.document_classification || data.document_type || 'Document'}
          </span>
        </div>
        {data.executive_summary && (
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#374151', margin: 0 }}>
            {data.executive_summary}
          </p>
        )}
      </Section>

      {/* Risks & Concerns */}
      {data.risks_and_concerns && data.risks_and_concerns.length > 0 && (
        <Section title="Risks & Concerns" icon="⚠️">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.risks_and_concerns.slice(0, 3).map((risk, i) => (
              <div key={i} style={{
                padding: '10px',
                background: risk.severity === 'high' ? '#fef2f2' : risk.severity === 'medium' ? '#fffbeb' : '#f9fafb',
                borderRadius: '6px',
                borderLeft: `3px solid ${risk.severity === 'high' ? '#dc2626' : risk.severity === 'medium' ? '#d97706' : '#9ca3af'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <SeverityBadge severity={risk.severity} />
                </div>
                <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
                  {risk.risk}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key Terms */}
      {data.key_terms && data.key_terms.length > 0 && (
        <Section title="Key Terms" icon="📜">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.key_terms.slice(0, 4).map((term, i) => (
              <div key={i} style={{
                padding: '8px 10px',
                background: '#f9fafb',
                borderRadius: '6px',
              }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '12px', marginBottom: '2px' }}>
                  {term.term}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>
                  {term.description}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Section title="Recommendations" icon="💡">
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {data.recommendations.slice(0, 4).map((rec, i) => (
              <li key={i} style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5, marginBottom: '4px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Legal Compliance */}
      {data.legal_compliance && (
        <Section title="Compliance" icon="⚖️">
          <div style={{
            padding: '10px',
            background: data.legal_compliance.appears_compliant ? '#f0fdf4' : '#fef2f2',
            borderRadius: '6px',
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: '12px',
              color: data.legal_compliance.appears_compliant ? '#166534' : '#dc2626',
            }}>
              {data.legal_compliance.appears_compliant ? '✓ Appears Compliant' : '✗ Compliance Concerns'}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};

export const DocumentAnalysisTab = ({ analysis, documentName, onRunAnalysis, isProcessing }: DocumentAnalysisTabProps) => {
  const claudeAnalysis = analysis?.claude;
  const geminiAnalysis = analysis?.gemini;
  const hasAnyAnalysis = claudeAnalysis || geminiAnalysis;

  if (!hasAnyAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '500px',
          background: '#fff',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
            AI Analysis for "{documentName}"
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', maxWidth: '400px' }}>
            Run AI analysis to extract insights, identify risks, and get recommendations from both Claude and Gemini
          </p>
          <button
            onClick={onRunAnalysis}
            disabled={isProcessing}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            {isProcessing ? 'Analyzing...' : 'Run Analysis'}
          </button>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            Powered by Claude 🧠 and Gemini ✨
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header with re-analyze button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Analysis: {documentName}
          </h3>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Side-by-side comparison from Claude and Gemini
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none',
            borderRadius: '8px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>🔄 Re-analyze</>
          )}
        </button>
      </div>

      {/* Side by side panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Claude Panel */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            background: PROVIDER_INFO.claude.bg,
            borderBottom: `2px solid ${PROVIDER_INFO.claude.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>{PROVIDER_INFO.claude.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: PROVIDER_INFO.claude.color }}>
              {PROVIDER_INFO.claude.name}
            </span>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <AnalysisPanel data={claudeAnalysis} provider="claude" />
          </div>
        </div>

        {/* Gemini Panel */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            background: PROVIDER_INFO.gemini.bg,
            borderBottom: `2px solid ${PROVIDER_INFO.gemini.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>{PROVIDER_INFO.gemini.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: PROVIDER_INFO.gemini.color }}>
              {PROVIDER_INFO.gemini.name}
            </span>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <AnalysisPanel data={geminiAnalysis} provider="gemini" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
