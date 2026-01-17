import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface StatusCardProps {
  title: string;
  description: string;
  status: 'ready' | 'pending' | 'waiting';
  icon: React.ReactNode;
}

const statusConfig = {
  ready: { variant: 'success' as const, label: 'Ready' },
  pending: { variant: 'warning' as const, label: 'Pending' },
  waiting: { variant: 'info' as const, label: 'Waiting' },
};

export const StatusCard = ({ title, description, status, icon }: StatusCardProps) => {
  return (
    <Card className="flex items-start gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <Badge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </Badge>
      </div>
    </Card>
  );
};