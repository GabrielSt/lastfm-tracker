/**
 * Camada de dados do frontend.
 *
 * Em produção (Vercel): lê JSONs estáticos de /public/data/
 * Em desenvolvimento local: ainda pode usar o backend Express em localhost:3001
 *
 * A detecção é automática: se DEV e backend disponível → usa backend.
 * Caso contrário → lê arquivos estáticos.
 */

import type {
  Config,
  RankingData,
  RankedArtist,
  RankedTrack,
  HistoryPoint,
  Snapshot,
} from '@/types';

const IS_DEV = import.meta.env.DEV;
const BACKEND = 'http://localhost:3001';

// ── Utilitários ───────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function backendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<Config> {
  if (IS_DEV && await backendAvailable()) {
    return fetchJSON<Config>(`${BACKEND}/config`);
  }
  // Estático: config pública não tem API key
  try {
    return fetchJSON<Config>('/data/config.json');
  } catch {
    return { username: '', apiKey: '', maxPages: 0 };
  }
}

export async function saveConfig(config: Partial<Config & { apiKey: string }>): Promise<Config> {
  if (IS_DEV && await backendAvailable()) {
    const res = await fetch(`${BACKEND}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json() as Promise<Config>;
  }
  throw new Error('Configuração só pode ser alterada em modo local');
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export async function getSnapshots(): Promise<string[]> {
  if (IS_DEV && await backendAvailable()) {
    const data = await fetchJSON<{ dates: string[] }>(`${BACKEND}/data/snapshots`);
    return data.dates;
  }
  // Estático: lê o índice gerado pelo script de sync
  try {
    const idx = await fetchJSON<{ dates: string[] }>('/data/snapshots/index.json');
    return idx.dates;
  } catch {
    return [];
  }
}

export async function getSnapshot(date: string): Promise<Snapshot> {
  if (IS_DEV && await backendAvailable()) {
    return fetchJSON<Snapshot>(`${BACKEND}/data/snapshots/${date}`);
  }
  return fetchJSON<Snapshot>(`/data/snapshots/${date}.json`);
}

// ── Ranking (calculado no frontend em modo estático) ──────────────────────────

export interface RankingParams {
  period?: string;
  compareWith?: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round(Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

function findNearestDate(target: string, dates: string[]): string | null {
  if (!dates.length) return null;
  return dates.reduce((best, d) =>
    daysBetween(d, target) < daysBetween(best, target) ? d : best
  );
}

function calcTrend(
  hasComparison: boolean,
  prevRank: number | undefined,
  delta: number | undefined
): RankedArtist['trend'] {
  if (!hasComparison) return 'stable';
  if (prevRank === undefined) return 'new';
  if (delta === 0) return 'stable';
  return delta! > 0 ? 'up' : 'down';
}

function buildRankingFromSnapshots(
  current: Snapshot,
  previous: Snapshot | null
): RankingData & { compareDate?: string } {
  const prevArtistRank = new Map<string, number>();
  const prevArtistScrobbles = new Map<string, number>();
  const prevTrackRank = new Map<string, { rank: number; scrobbles: number }>();

  const hasComparison = previous !== null;

  if (previous) {
    previous.artists.forEach(a => {
      prevArtistRank.set(a.name, a.rank);
      prevArtistScrobbles.set(a.name, a.scrobbles);
    });
    previous.tracks.forEach(t => {
      prevTrackRank.set(`${t.artist}::${t.name}`, { rank: t.rank, scrobbles: t.scrobbles });
    });
  }

  const artists: RankedArtist[] = current.artists.map(a => {
    const prevRank = prevArtistRank.get(a.name);
    const prevScrobbles = prevArtistScrobbles.get(a.name);
    const delta = prevRank !== undefined ? prevRank - a.rank : undefined;
    return {
      ...a,
      previousRank: prevRank,
      delta,
      newScrobbles: prevScrobbles !== undefined ? a.scrobbles - prevScrobbles : undefined,
      trend: calcTrend(hasComparison, prevRank, delta),
    };
  });

  const tracks: RankedTrack[] = current.tracks.map(t => {
    const key = `${t.artist}::${t.name}`;
    const prev = prevTrackRank.get(key);
    const delta = prev ? prev.rank - t.rank : undefined;
    return {
      ...t,
      previousRank: prev?.rank,
      delta,
      newScrobbles: prev ? t.scrobbles - prev.scrobbles : undefined,
      trend: calcTrend(hasComparison, prev?.rank, delta),
    };
  });

  return {
    current,
    previous: previous ?? undefined,
    compareDate: previous?.date,
    artists,
    tracks,
  };
}

export async function getRanking(params?: RankingParams): Promise<RankingData & { compareDate?: string }> {
  // Em dev com backend disponível, delega para o backend
  if (IS_DEV && await backendAvailable()) {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    if (params?.compareWith) query.set('compareWith', params.compareWith);
    const qs = query.toString();
    return fetchJSON<RankingData & { compareDate?: string }>(
      `${BACKEND}/data/ranking${qs ? `?${qs}` : ''}`
    );
  }

  // Modo estático: calcula ranking localmente
  const dates = await getSnapshots();
  if (!dates.length) throw new Error('404');

  const currentDate = dates[dates.length - 1];
  const olderDates = dates.slice(0, -1);

  let compareDate: string | null = null;

  if (params?.compareWith && params.compareWith !== 'none') {
    compareDate = params.compareWith;
  } else if (params?.period && params.period !== 'none') {
    const periodDays: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365,
    };
    const days = periodDays[params.period];
    if (days && olderDates.length > 0) {
      const target = new Date(currentDate);
      target.setDate(target.getDate() - days);
      compareDate = findNearestDate(target.toISOString().split('T')[0], olderDates);
    } else if (params.period === 'all' && olderDates.length > 0) {
      compareDate = olderDates[0];
    } else if (olderDates.length > 0) {
      compareDate = olderDates[olderDates.length - 1];
    }
  } else if (olderDates.length > 0) {
    compareDate = olderDates[olderDates.length - 1];
  }

  const [current, previous] = await Promise.all([
    getSnapshot(currentDate),
    compareDate ? getSnapshot(compareDate) : Promise.resolve(null),
  ]);

  return buildRankingFromSnapshots(current, previous);
}

// ── Histórico ─────────────────────────────────────────────────────────────────

async function buildHistory(
  dates: string[],
  matcher: (s: Snapshot) => { rank: number | null; scrobbles: number | null }
): Promise<HistoryPoint[]> {
  const snapshots = await Promise.all(dates.map(d => getSnapshot(d)));
  return snapshots.map((s, i) => ({ date: dates[i], ...matcher(s) }));
}

export async function getArtistHistory(name: string): Promise<HistoryPoint[]> {
  if (IS_DEV && await backendAvailable()) {
    const res = await fetch(`${BACKEND}/data/history/artist/${encodeURIComponent(name)}`);
    return res.json() as Promise<HistoryPoint[]>;
  }
  const dates = await getSnapshots();
  return buildHistory(dates, s => {
    const e = s.artists.find(a => a.name.toLowerCase() === name.toLowerCase());
    return { rank: e?.rank ?? null, scrobbles: e?.scrobbles ?? null };
  });
}

export async function getTrackHistory(name: string, artist: string): Promise<HistoryPoint[]> {
  if (IS_DEV && await backendAvailable()) {
    const res = await fetch(
      `${BACKEND}/data/history/track/${encodeURIComponent(name)}?artist=${encodeURIComponent(artist)}`
    );
    return res.json() as Promise<HistoryPoint[]>;
  }
  const dates = await getSnapshots();
  return buildHistory(dates, s => {
    const e = s.tracks.find(
      t => t.name.toLowerCase() === name.toLowerCase() &&
           t.artist.toLowerCase() === artist.toLowerCase()
    );
    return { rank: e?.rank ?? null, scrobbles: e?.scrobbles ?? null };
  });
}

// ── Sync (só em dev local) ────────────────────────────────────────────────────

export async function startSync(): Promise<void> {
  if (!IS_DEV) throw new Error('Sync manual não disponível em produção');
  await fetch(`${BACKEND}/sync`, { method: 'POST' });
}

export async function getSyncStatus() {
  if (!IS_DEV) return { running: false };
  const res = await fetch(`${BACKEND}/sync/status`);
  return res.json();
}
