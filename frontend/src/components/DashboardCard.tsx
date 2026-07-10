import { type ReactNode } from 'react';
import Card from './ui/Card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  color?: 'blue' | 'orange' | 'red' | 'green';
}

const colorMap = {
  blue: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
  orange: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
  red: 'text-danger-400 bg-danger-500/10 border-danger-500/20',
  green: 'text-success-400 bg-success-500/10 border-success-500/20',
};

const pulseMap = {
  blue: 'bg-primary-500',
  orange: 'bg-warning-500',
  red: 'bg-danger-500',
  green: 'bg-success-500',
};

export default function DashboardCard({ title, value, icon, subtitle, color = 'blue' }: DashboardCardProps) {
  return (
    <Card variant="glass" padding="lg" className="relative group overflow-hidden">
      {/* Decorative background blur */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${pulseMap[color]}`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-mono font-medium text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[40px] leading-tight font-bold font-display text-white tracking-tight">{value}</h3>
            {/* Status indicator */}
            <span className="relative flex h-2.5 w-2.5 mb-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseMap[color]}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseMap[color]}`}></span>
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
        </div>
        
        <div className={`p-3 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
