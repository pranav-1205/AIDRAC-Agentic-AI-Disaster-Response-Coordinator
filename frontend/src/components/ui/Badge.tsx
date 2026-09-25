import { type CSSProperties, type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const variantStyles = {
  default: 'bg-[var(--card-bg)] text-on-surface border border-[var(--card-border)]',
  primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
  success: 'bg-success-500/10 text-success-400 border border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  danger: 'bg-danger-500/10 text-danger-400 border border-danger-500/20',
  info: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px] tracking-wider uppercase font-mono',
  sm: 'px-2 py-0.5 text-xs tracking-wider uppercase font-mono',
  md: 'px-2.5 py-1 text-xs tracking-wide uppercase font-mono',
};

export default function Badge({ variant = 'default', size = 'sm', children, className = '', style }: BadgeProps) {
  return (
    <span style={style} className={`inline-flex items-center justify-center gap-1 rounded-md font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
