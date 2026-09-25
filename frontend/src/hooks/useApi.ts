import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the fetcher, still allowed to be served from the API cache. */
  refetch: () => void;
  /** Re-run the fetcher and bypass the API cache (explicit user refresh/retry). */
  forceRefetch: () => void;
}

/**
 * Minimal request hook: runs `fetcher` on mount and whenever `deps` change.
 *
 * The fetcher receives an optional `force` flag. It is `false` for the initial
 * and dependency-triggered runs, and `true` only when a user explicitly asks to
 * refresh. Services that support caching (see services/apiCache.ts) use it to
 * decide between a cached value and a real network request, so existing
 * zero-argument fetchers keep working unchanged.
 */
export function useApi<T>(
  fetcher: (force?: boolean) => Promise<{ data: T }>,
  deps: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(force);
      setData(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refetch = useCallback(() => {
    fetch(false);
  }, [fetch]);

  const forceRefetch = useCallback(() => {
    fetch(true);
  }, [fetch]);

  return { data, loading, error, refetch, forceRefetch };
}
