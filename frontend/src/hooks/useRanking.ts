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
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : null;
      if (status === 404) {
        setError('Nenhum dado encontrado. Faça uma sincronização primeiro.');
      } else {
        setError('Erro ao carregar dados. O backend está rodando?');
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
