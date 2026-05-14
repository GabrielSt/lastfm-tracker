import { useState, useEffect, useCallback } from 'react';
import { getRanking, getSnapshots } from '@/api';
import type { RankingData } from '@/types';

export type PeriodOption = '7d' | '30d' | '90d' | '180d' | '365d' | 'all' | 'custom';

export interface RankingParams {
  period?: string;
  compareWith?: string; // YYYY-MM-DD explícito
}

export function useRanking() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<RankingParams>({});
  const [snapshots, setSnapshots] = useState<string[]>([]);

  // Carrega lista de snapshots disponíveis
  useEffect(() => {
    getSnapshots().then(setSnapshots).catch(() => {});
  }, []);

  const fetch = useCallback(async (fetchParams?: RankingParams) => {
    setLoading(true);
    setError(null);
    try {
      const p = fetchParams ?? params;
      const ranking = await getRanking(p);
      setData(ranking);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is404 = msg.includes('404') || msg.includes('sincronização') || msg.includes('No data');
      if (is404) {
        setError('No data yet. Trigger a sync from the GitHub Actions tab.');
      } else {
        // Em produção não há backend — não mencionar isso na mensagem de erro
        const isDev = import.meta.env.DEV;
        setError(isDev ? `Error loading data. Is the backend running? (${msg})` : `Error loading data: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [params]);

  const changeParams = useCallback((newParams: RankingParams) => {
    setParams(newParams);
  }, []);

  return { data, loading, error, refetch: () => fetch(), changeParams, params, snapshots };
}
