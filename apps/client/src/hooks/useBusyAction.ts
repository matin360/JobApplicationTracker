import { useCallback, useState } from 'react';

export interface BusyAction {
  busy: boolean;
  error: string;
  /** Run a mutation: sets busy, clears the previous error, captures a new one. */
  run: (action: () => Promise<void>) => Promise<void>;
}

// Shared busy/error wrapper for user-triggered mutations (add/edit/delete/export).
export function useBusyAction(): BusyAction {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, run };
}
