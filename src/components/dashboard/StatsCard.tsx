import { Card } from '../common/Card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: 'purple' | 'blue' | 'green' | 'orange';
}

const colorConfig = {
  purple: 'bg-primary-100 text-primary-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
};

export const StatsCard = ({ title, value, icon, color = 'purple' }: StatsCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorConfig[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};