import { type ReactNode } from 'react';
import MaterialIcon from './MaterialIcon';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MaterialIcon icon="inbox" className="text-6xl text-on-surface-variant/40 mb-4" />
      <h3 className="text-lg font-medium text-on-surface mb-1">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant mb-4">{description}</p>}
      {action}
    </div>
  );
}