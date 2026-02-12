// src/components/criminal-law/StatusBadge.tsx

import { Badge } from '../common/Badge';

interface StatusBadgeProps {
  status: 'valid' | 'history' | 'repealed_law' | 'case_digest' | 'practice_guide';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  valid: { variant: 'success' as const, label: 'Valid' },
  history: { variant: 'blue' as const, label: 'History' },
  repealed_law: { variant: 'error' as const, label: 'Repealed' },
  case_digest: { variant: 'purple' as const, label: 'Case Digest' },
  practice_guide: { variant: 'orange' as const, label: 'Guide' },
};

export const StatusBadge = ({ status, size = 'sm' }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.valid;
  
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};