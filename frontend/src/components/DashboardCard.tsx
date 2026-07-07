import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  color?: 'blue' | 'orange' | 'red' | 'green';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  green: 'bg-green-50 text-green-600 border-green-200',
};

export default function DashboardCard({ title, value, icon, subtitle, color = 'blue' }: DashboardCardProps) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
