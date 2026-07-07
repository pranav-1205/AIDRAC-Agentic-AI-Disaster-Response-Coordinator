export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizeClass[size]} border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin`}
      />
    </div>
  );
}
