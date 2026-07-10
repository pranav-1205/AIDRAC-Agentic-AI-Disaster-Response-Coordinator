import Badge from './Badge';

interface StatusBadgeProps {
  severity: string;
  className?: string;
}

const severityMap: Record<string, { variant: 'danger' | 'warning' | 'info' | 'default'; label: string }> = {
  critical: { variant: 'danger', label: 'Critical' },
  severe: { variant: 'warning', label: 'Severe' },
  high: { variant: 'warning', label: 'High' },
  warning: { variant: 'info', label: 'Warning' },
  moderate: { variant: 'info', label: 'Moderate' },
  info: { variant: 'info', label: 'Info' },
  low: { variant: 'default', label: 'Low' },
  active: { variant: 'danger', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
};

export default function StatusBadge({ severity, className = '' }: StatusBadgeProps) {
  const config = severityMap[severity.toLowerCase()] ?? { variant: 'default' as const, label: severity };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
