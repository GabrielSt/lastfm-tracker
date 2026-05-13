import { useState, useEffect, useCallback } from 'react';
import { startSync, getSyncStatus } from '@/api';
import type { SyncStatus } from '@/types';

export function useSync(onComplete?: () => void) {
  const [status, setStatus] = useState<SyncStatus>({ running: false });
  const [polling, setPolling] = useState(false);

  // Poll status enquanto sincronizando
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const s = await getSyncStatus();
        setStatus(s);
        if (!s.running) {
          setPolling(false);
          if (s.lastResult?.success) onComplete?.();
        }
      } catch {
        setPolling(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [polling, onComplete]);

  const triggerSync = useCallback(async () => {
    try {
      await startSync();
      setStatus({ running: true });
      setPolling(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar sincronização';
      setStatus({ running: false, lastResult: { success: false, artistCount: 0, trackCount: 0, duration: 0, error: msg } });
    }
  }, []);

  return { status, triggerSync };
}
