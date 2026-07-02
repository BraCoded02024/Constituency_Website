'use client';

import { useEffect, useState } from 'react';

export type PublicListState<T> = {
  data: T[];
  loading: boolean;
  error: boolean;
  fromFallback: boolean;
};

export function usePublicList<T>(
  fetcher: () => Promise<unknown>,
  fallback: readonly T[],
  reloadToken = 0,
): PublicListState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetcher()
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? (result as T[]) : [];
        if (list.length > 0) {
          setData(list);
          setFromFallback(false);
          setError(false);
        } else {
          setData([...fallback]);
          setFromFallback(true);
          setError(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData([...fallback]);
        setFromFallback(true);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally mount-only unless reloadToken changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  return { data, loading, error, fromFallback };
}
