import { type ReactNode } from 'react';
import MaterialIcon from './MaterialIcon';
import Button from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MaterialIcon icon="error" className="text-6xl text-danger-400 mb-4" />
      <h3 className="text-lg font-medium text-on-surface mb-1">Something went wrong</h3>
      <p className="text-sm text-on-surface-variant mb-4">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <MaterialIcon icon="refresh" className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}