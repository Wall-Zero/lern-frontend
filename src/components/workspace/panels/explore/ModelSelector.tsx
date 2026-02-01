import { useState } from 'react';

export type Provider = 'claude' | 'gemini' | 'gpt4';

interface ModelSelectorProps {
  selectedProviders: Provider[];
  onSelectionChange: (providers: Provider[]) => void;
  disabled?: boolean;
  maxSelection?: number;
}

const PROVIDERS = [
  {
    id: 'claude' as Provider,
    name: 'Claude',
    color: '#D97706',
    bg: '#FEF3C7',
    description: 'Anthropic Claude - Deep reasoning'
  },
  {
    id: 'gemini' as Provider,
    name: 'Gemini',
    color: '#2563EB',
    bg: '#DBEAFE',
    description: 'Google Gemini - Fast analysis'
  },
  {
    id: 'gpt4' as Provider,
    name: 'GPT-4',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'OpenAI GPT-4 - Versatile intelligence'
  },
];

export const ModelSelector = ({
  selectedProviders,
  onSelectionChange,
  disabled = false,
  maxSelection = 2
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleProvider = (providerId: Provider) => {
    if (disabled) return;

    const isSelected = selectedProviders.includes(providerId);

    if (isSelected) {
      // Don't allow deselecting if only one is selected
      if (selectedProviders.length === 1) return;
      onSelectionChange(selectedProviders.filter(p => p !== providerId));
    } else {
      // Check max selection limit
      if (selectedProviders.length >= maxSelection) {
        // Replace the first selected provider
        onSelectionChange([...selectedProviders.slice(1), providerId]);
      } else {
        onSelectionChange([...selectedProviders, providerId]);
      }
    }
  };

  const getSelectedLabel = () => {
    if (selectedProviders.length === 0) return 'Select model(s)';
    if (selectedProviders.length === 3) return 'All Models';
    if (selectedProviders.length === 2) {
      const names = selectedProviders.map(p => PROVIDERS.find(pr => pr.id === p)?.name).join(' + ');
      return names;
    }
    const provider = PROVIDERS.find(p => p.id === selectedProviders[0]);
    return provider?.name || 'Select model(s)';
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '6px'
      }}>
        AI Model(s)
      </label>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: disabled ? '#f9fafb' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#111827',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedProviders.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {selectedProviders.map(p => {
                const provider = PROVIDERS.find(pr => pr.id === p);
                return (
                  <span key={p} style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: provider?.color
                  }} />
                );
              })}
            </div>
          )}
          <span>{getSelectedLabel()}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s'
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 20,
            overflow: 'hidden',
          }}>
            {/* Quick select options */}
            <div style={{
              padding: '8px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                Quick Select
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectionChange(['claude', 'gemini', 'gpt4']);
                    setIsOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: selectedProviders.length === 3 ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : '#fff',
                    color: selectedProviders.length === 3 ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {PROVIDERS.map(p => (
                    <span key={p.id} style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: selectedProviders.length === 3 ? '#fff' : p.color
                    }} />
                  ))}
                  <span style={{ marginLeft: '4px' }}>All Models</span>
                </button>
              </div>
            </div>

            {/* Individual providers */}
            <div style={{ padding: '8px' }}>
              {PROVIDERS.map((provider) => {
                const isSelected = selectedProviders.includes(provider.id);
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => toggleProvider(provider.id)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: isSelected ? provider.bg : 'transparent',
                      border: `2px solid ${isSelected ? provider.color : 'transparent'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: provider.color,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                        {provider.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {provider.description}
                      </div>
                    </div>
                    {isSelected && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={provider.color}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info */}
            <div style={{
              padding: '10px 12px',
              background: '#f0fdf4',
              borderTop: '1px solid #e5e7eb',
              fontSize: '11px',
              color: '#166534',
            }}>
              Select 2 models for side-by-side comparison
            </div>
          </div>
        </>
      )}
    </div>
  );
};
