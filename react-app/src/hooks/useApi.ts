// ============================================================
// useApi Hook – generic data fetching with loading/error state
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import type { AxiosPromise } from 'axios';

interface UseApiState<T> {
  data    : T | null;
  loading : boolean;
  error   : string | null;
  refetch : () => void;
}

export function useApi<T>(
  fetcher: () => AxiosPromise<{ success: boolean; data: T }>,
  deps: unknown[] = []
): UseApiState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res.data.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
