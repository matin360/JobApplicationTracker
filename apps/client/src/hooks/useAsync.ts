import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  /** Re-run the loader (e.g. after a mutation). Keeps stale data visible while it runs. */
  reload: () => Promise<void>;
  /** Replace the loaded data locally (e.g. after a child-record mutation). */
  setData: (data: T) => void;
}

// Shared loader-effect used by every page that fetches on mount: tracks
// loading/error, ignores results from superseded runs (unmount or key change),
// and exposes reload/setData for pages that mutate after loading.
export function useAsync<T>(load: () => Promise<T>, key?: unknown): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep the latest loader without making it an effect dependency, so callers
  // can pass inline arrow functions.
  const loadRef = useRef(load);
  loadRef.current = load;
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    setError('');
    try {
      const result = await loadRef.current();
      if (runId === runIdRef.current) {
        setData(result);
      }
    } catch (err) {
      if (runId === runIdRef.current) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      if (runId === runIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void run();
    return () => {
      // Invalidate in-flight runs on unmount/key change.
      runIdRef.current += 1;
    };
  }, [run, key]);

  return { data, loading, error, reload: run, setData };
}
