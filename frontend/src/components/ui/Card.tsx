import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  default: 'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-card',
  elevated: 'bg-[var(--card-bg-hover)] border border-[var(--card-border)] shadow-elevated',
  interactive: 'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-card hover:shadow-card-hover hover:bg-[var(--card-bg-hover)] cursor-pointer transition-all duration-200',
  glass: 'glass-panel',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  // If glass is chosen, the rounded-xl and overflow-hidden is already in the class
  const roundedClass = variant === 'glass' ? '' : 'rounded-xl overflow-hidden';
  return (
    <div
      className={`${roundedClass} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
