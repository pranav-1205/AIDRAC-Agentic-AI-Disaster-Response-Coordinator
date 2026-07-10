import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, subtitle, action, icon, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-primary-500 shrink-0">{icon}</span>}
        <div>
          <h2 className="text-headline-md text-on-surface">{title}</h2>
          {subtitle && <p className="text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
