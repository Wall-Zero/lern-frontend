import { motion } from 'framer-motion';

interface DocumentAnalysis {
  success: boolean;
  provider: string;
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
}

interface DocumentAnalysisTabProps {
  analysis: { claude?: DocumentAnalysis; gemini?: DocumentAnalysis } | null;
  documentName: string;
  documentType: string;
  onRunAnalysis: () => void;
  isProcessing: boolean;
}

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
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    marginBottom: '16px',
  }}>
    <div style={{
      padding: '14px 16px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
    </div>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </div>
);

export const DocumentAnalysisTab = ({ analysis, documentName, documentType, onRunAnalysis, isProcessing }: DocumentAnalysisTabProps) => {
  const provider = analysis?.claude ?? analysis?.gemini ?? null;

  if (!provider) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '60px 20px' }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
          {documentName}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
          {documentType.toUpperCase()} Document
        </p>
        <button
          onClick={onRunAnalysis}
          disabled={isProcessing}
          style={{
            padding: '12px 32px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            borderRadius: '8px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          {isProcessing ? 'Analyzing Document...' : 'Run Legal Analysis'}
        </button>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
          AI will analyze for key terms, risks, obligations, and more
        </p>
      </motion.div>
    );
  }

  // Handle raw analysis (parsing failed)
  if (provider.raw_analysis) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Section title="Analysis Result" icon="📝">
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#374151',
            margin: 0,
          }}>
            {provider.raw_analysis}
          </pre>
        </Section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Document Type & Summary */}
      <Section title="Document Overview" icon="📋">
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#ede9fe',
            color: '#7c3aed',
          }}>
            {provider.document_classification || provider.document_type || documentType.toUpperCase()}
          </span>
        </div>
        {provider.executive_summary && (
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#374151', margin: 0 }}>
            {provider.executive_summary}
          </p>
        )}
      </Section>

      {/* Risks & Concerns */}
      {provider.risks_and_concerns && provider.risks_and_concerns.length > 0 && (
        <Section title="Risks & Concerns" icon="⚠️">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {provider.risks_and_concerns.map((risk, i) => (
              <div key={i} style={{
                padding: '12px',
                background: risk.severity === 'high' ? '#fef2f2' : risk.severity === 'medium' ? '#fffbeb' : '#f9fafb',
                borderRadius: '8px',
                borderLeft: `3px solid ${risk.severity === 'high' ? '#dc2626' : risk.severity === 'medium' ? '#d97706' : '#9ca3af'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <SeverityBadge severity={risk.severity} />
                  {risk.affected_party && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Affects: {risk.affected_party}</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px 0', fontWeight: 500 }}>
                  {risk.risk}
                </p>
                {risk.recommendation && (
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    💡 {risk.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Parties Involved */}
      {provider.parties_involved && provider.parties_involved.length > 0 && (
        <Section title="Parties Involved" icon="👥">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {provider.parties_involved.map((party, i) => (
              <div key={i} style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
              }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{party.name}</div>
                <div style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '8px' }}>{party.role}</div>
                {party.obligations && party.obligations.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#6b7280' }}>
                    {party.obligations.slice(0, 3).map((ob, j) => (
                      <li key={j} style={{ marginBottom: '2px' }}>{ob}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key Terms */}
      {provider.key_terms && provider.key_terms.length > 0 && (
        <Section title="Key Terms & Clauses" icon="📜">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {provider.key_terms.map((term, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '13px', marginBottom: '4px' }}>
                    {term.term}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                    {term.description}
                  </div>
                </div>
                <SeverityBadge severity={term.importance} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Important Dates */}
      {provider.important_dates && provider.important_dates.length > 0 && (
        <Section title="Important Dates" icon="📅">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {provider.important_dates.map((date, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                background: '#f0fdf4',
                borderRadius: '8px',
              }}>
                <div style={{
                  padding: '6px 10px',
                  background: '#dcfce7',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#166534',
                  whiteSpace: 'nowrap',
                }}>
                  {date.date}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{date.significance}</div>
                  {date.action_required && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Action: {date.action_required}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Financial Terms */}
      {provider.financial_terms && provider.financial_terms.length > 0 && (
        <Section title="Financial Terms" icon="💰">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {provider.financial_terms.map((term, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: '#fefce8',
                borderRadius: '8px',
                borderLeft: '3px solid #eab308',
              }}>
                <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{term.description}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {term.amount && <span style={{ marginRight: '12px' }}>💵 {term.amount}</span>}
                  {term.frequency && <span style={{ marginRight: '12px' }}>🔄 {term.frequency}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Items */}
      {provider.action_items && provider.action_items.length > 0 && (
        <Section title="Action Items" icon="✅">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {provider.action_items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
              }}>
                <SeverityBadge severity={item.priority} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.action}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.responsible_party && <span>By: {item.responsible_party}</span>}
                    {item.deadline && <span style={{ marginLeft: '12px' }}>Due: {item.deadline}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      {provider.recommendations && provider.recommendations.length > 0 && (
        <Section title="Recommendations" icon="💡">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {provider.recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '6px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Questions to Clarify */}
      {provider.questions_to_clarify && provider.questions_to_clarify.length > 0 && (
        <Section title="Questions to Clarify" icon="❓">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {provider.questions_to_clarify.map((q, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '6px' }}>
                {q}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Legal Compliance */}
      {provider.legal_compliance && (
        <Section title="Legal Compliance" icon="⚖️">
          <div style={{
            padding: '12px',
            background: provider.legal_compliance.appears_compliant ? '#f0fdf4' : '#fef2f2',
            borderRadius: '8px',
            borderLeft: `3px solid ${provider.legal_compliance.appears_compliant ? '#16a34a' : '#dc2626'}`,
          }}>
            <div style={{
              fontWeight: 600,
              color: provider.legal_compliance.appears_compliant ? '#166534' : '#dc2626',
              marginBottom: '8px',
            }}>
              {provider.legal_compliance.appears_compliant ? '✓ Appears Compliant' : '✗ Compliance Concerns'}
            </div>
            {provider.legal_compliance.potential_issues && provider.legal_compliance.potential_issues.length > 0 && (
              <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px', fontSize: '13px', color: '#6b7280' }}>
                {provider.legal_compliance.potential_issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
            {provider.legal_compliance.jurisdictional_notes && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                📍 {provider.legal_compliance.jurisdictional_notes}
              </p>
            )}
          </div>
        </Section>
      )}
    </motion.div>
  );
};
