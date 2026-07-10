import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-on-surface-variant/30 mb-4" />
      <h3 className="text-lg font-medium text-on-surface mb-1">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant/70">{description}</p>}
    </div>
  );
}
