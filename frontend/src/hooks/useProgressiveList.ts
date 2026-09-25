import { useEffect, useState } from 'react';

interface UseProgressiveListOptions {
  initialCount?: number;
  increment?: number;
}

interface UseProgressiveListResult<T> {
  visibleItems: T[];
  visibleCount: number;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

const DEFAULT_INITIAL_COUNT = 25;
const DEFAULT_INCREMENT = 20;

/**
 * Hook for progressive display of already-fetched data.
 * Does NOT trigger any API requests on load more - only reveals more
 * of the already-fetched and sorted data.
 */
export function useProgressiveList<T>(
  items: T[],
  options: UseProgressiveListOptions = {}
): UseProgressiveListResult<T> {
  const {
    initialCount = DEFAULT_INITIAL_COUNT,
    increment = DEFAULT_INCREMENT,
  } = options;

  const [visibleCount, setVisibleCount] = useState(initialCount);

  // Reset to initialCount when the underlying dataset changes identity
  // (new location, new radius, refetch). Never based on items.length alone.
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items, initialCount]);

  const totalCount = items.length;

  const effectiveVisibleCount = Math.min(visibleCount, totalCount);

  const visibleItems = items.slice(0, effectiveVisibleCount);

  const hasMore = effectiveVisibleCount < totalCount;

  const loadMore = () => {
    setVisibleCount((previous) => Math.min(previous + increment, totalCount));
  };

  const reset = () => {
    setVisibleCount(initialCount);
  };

  return {
    visibleItems,
    visibleCount: effectiveVisibleCount,
    totalCount,
    hasMore,
    loadMore,
    reset,
  };
}
