import { Router, Request, Response } from 'express';
import {
  getLatestSnapshot,
  getAllSnapshotDates,
  readSnapshot,
} from '../storage';
import { RankedArtist, RankedTrack, RankingData } from '../types';

const router = Router();

// Calcula quantos dias atrás uma data está
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

// Encontra o snapshot mais próximo de N dias atrás em relação a uma data base
function findSnapshotNearDate(targetDate: string, dates: string[]): string | null {
  if (dates.length === 0) return null;
  return dates.reduce((best, date) => {
    const diffBest = Math.abs(daysBetween(best, targetDate));
    const diffCurr = Math.abs(daysBetween(date, targetDate));
    return diffCurr < diffBest ? date : best;
  });
}

function buildRanking(currentDate: string, compareDate: string | null): RankingData {
  const current = readSnapshot(currentDate)!;
  const previous = compareDate ? readSnapshot(compareDate) : null;

  const prevArtistMap = new Map<string, number>();
  const prevArtistScrobbles = new Map<string, number>();
  const prevTrackMap = new Map<string, number>();
  const prevTrackScrobbles = new Map<string, number>();

  if (previous) {
    previous.artists.forEach(a => {
      prevArtistMap.set(a.name, a.rank);
      prevArtistScrobbles.set(a.name, a.scrobbles);
    });
    previous.tracks.forEach(t => {
      const key = `${t.artist}::${t.name}`;
      prevTrackMap.set(key, t.rank);
      prevTrackScrobbles.set(key, t.scrobbles);
    });
  }

  // Se não há snapshot anterior para comparar, tudo é 'stable' (sem dados suficientes para 'new')
  const hasComparison = previous !== null;

  const artists: RankedArtist[] = current.artists.map(a => {
    const prevRank = prevArtistMap.get(a.name);
    const prevScrobbles = prevArtistScrobbles.get(a.name);
    const delta = prevRank !== undefined ? prevRank - a.rank : undefined;
    const newScrobbles = prevScrobbles !== undefined ? a.scrobbles - prevScrobbles : undefined;

    return {
      ...a,
      previousRank: prevRank,
      delta,
      newScrobbles,
      trend: !hasComparison
        ? 'stable'
        : prevRank === undefined
        ? 'new'
        : delta === 0
        ? 'stable'
        : delta! > 0
        ? 'up'
        : 'down',
    };
  });

  const tracks: RankedTrack[] = current.tracks.map(t => {
    const key = `${t.artist}::${t.name}`;
    const prevRank = prevTrackMap.get(key);
    const prevScrobbles = prevTrackScrobbles.get(key);
    const delta = prevRank !== undefined ? prevRank - t.rank : undefined;
    const newScrobbles = prevScrobbles !== undefined ? t.scrobbles - prevScrobbles : undefined;

    return {
      ...t,
      previousRank: prevRank,
      delta,
      newScrobbles,
      trend: !hasComparison
        ? 'stable'
        : prevRank === undefined
        ? 'new'
        : delta === 0
        ? 'stable'
        : delta! > 0
        ? 'up'
        : 'down',
    };
  });

  return { current, previous: previous ?? undefined, artists, tracks };
}

// GET /data/ranking
// Query params:
//   compareWith=YYYY-MM-DD  — compara com snapshot específico
//   period=7d|30d|90d|180d|365d|all — compara com snapshot mais próximo do período
router.get('/ranking', (req: Request, res: Response) => {
  const current = getLatestSnapshot();
  if (!current) {
    res.status(404).json({ error: 'Nenhum snapshot encontrado. Faça uma sincronização primeiro.' });
    return;
  }

  const dates = getAllSnapshotDates();
  const currentDate = current.date;
  // Todos os snapshots exceto o mais recente (para comparação)
  const olderDates = dates.filter(d => d < currentDate);

  let compareDate: string | null = null;

  const { compareWith, period } = req.query as { compareWith?: string; period?: string };

  if (compareWith && compareWith !== 'none') {
    // Data explícita passada
    compareDate = compareWith;
  } else if (period && period !== 'none') {
    const periodDays: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    };
    const days = periodDays[period];
    if (days && olderDates.length > 0) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() - days);
      const targetStr = targetDate.toISOString().split('T')[0];
      compareDate = findSnapshotNearDate(targetStr, olderDates);
    } else if (period === 'all' && olderDates.length > 0) {
      // Compara com o snapshot mais antigo disponível
      compareDate = olderDates[0];
    }
  } else if (olderDates.length > 0) {
    // Default: snapshot anterior mais recente
    compareDate = olderDates[olderDates.length - 1];
  }

  const ranking = buildRanking(currentDate, compareDate);
  res.json({ ...ranking, compareDate });
});

// GET /data/snapshots - lista todos os snapshots disponíveis
router.get('/snapshots', (_req: Request, res: Response) => {
  const dates = getAllSnapshotDates();
  res.json({ dates });
});

// GET /data/snapshots/:date - retorna snapshot específico
router.get('/snapshots/:date', (req: Request, res: Response) => {
  const snapshot = readSnapshot(req.params.date);
  if (!snapshot) {
    res.status(404).json({ error: 'Snapshot não encontrado' });
    return;
  }
  res.json(snapshot);
});

// GET /data/history/:type/:name - histórico de posição de um artista ou track
router.get('/history/:type/:name', (req: Request, res: Response) => {
  const { type, name } = req.params;
  const artist = req.query.artist as string | undefined;
  const dates = getAllSnapshotDates();

  const history = dates.map(date => {
    const snapshot = readSnapshot(date);
    if (!snapshot) return null;

    if (type === 'artist') {
      const entry = snapshot.artists.find(
        a => a.name.toLowerCase() === decodeURIComponent(name).toLowerCase()
      );
      return { date, rank: entry?.rank ?? null, scrobbles: entry?.scrobbles ?? null };
    } else {
      const entry = snapshot.tracks.find(
        t =>
          t.name.toLowerCase() === decodeURIComponent(name).toLowerCase() &&
          (!artist || t.artist.toLowerCase() === artist.toLowerCase())
      );
      return { date, rank: entry?.rank ?? null, scrobbles: entry?.scrobbles ?? null };
    }
  });

  res.json(history.filter(Boolean));
});

export default router;
