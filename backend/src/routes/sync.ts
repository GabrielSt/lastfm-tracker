import { Router, Request, Response } from 'express';
import { readConfig, writeConfig, writeSnapshot } from '../storage';
import { fetchArtists } from '../scraper/artists';
import { fetchTracks } from '../scraper/tracks';
import { Snapshot, SyncStatus } from '../types';

const router = Router();

let syncStatus: SyncStatus = { running: false };

router.get('/status', (_req: Request, res: Response) => {
  res.json(syncStatus);
});

router.post('/', async (_req: Request, res: Response) => {
  if (syncStatus.running) {
    res.status(409).json({ error: 'Sincronização já em andamento' });
    return;
  }

  const config = readConfig();

  if (!config.username) {
    res.status(400).json({ error: 'Configure um username antes de sincronizar' });
    return;
  }

  if (!config.apiKey) {
    res.status(400).json({ error: 'Configure uma API key do Last.fm antes de sincronizar' });
    return;
  }

  res.json({ message: 'Sincronização iniciada', username: config.username });

  runSync(config.username, config.apiKey, config.maxPages ?? 0);
});

async function runSync(username: string, apiKey: string, maxPages: number) {
  syncStatus = { running: true, progress: { phase: 'artists', page: 0, total: undefined } };
  const start = Date.now();

  try {
    console.log(`[sync] Iniciando para @${username} (maxPages=${maxPages})`);

    const artists = await fetchArtists(username, apiKey, maxPages, (page, total) => {
      syncStatus = { running: true, progress: { phase: 'artists', page, total } };
      console.log(`[sync] Artistas: ${page}/${total}`);
    });

    syncStatus = { running: true, progress: { phase: 'tracks', page: 0, total: undefined } };

    const tracks = await fetchTracks(username, apiKey, maxPages, (page, total) => {
      syncStatus = { running: true, progress: { phase: 'tracks', page, total } };
      console.log(`[sync] Músicas: ${page}/${total}`);
    });

    const date = new Date().toISOString().split('T')[0];
    const snapshot: Snapshot = {
      date,
      username,
      syncedAt: new Date().toISOString(),
      artists,
      tracks,
    };

    writeSnapshot(snapshot);

    const config = readConfig();
    writeConfig({ ...config, lastSync: new Date().toISOString() });

    const duration = Date.now() - start;
    console.log(
      `[sync] Concluído em ${(duration / 1000).toFixed(1)}s — ${artists.length} artistas, ${tracks.length} músicas`
    );

    syncStatus = {
      running: false,
      lastResult: { success: true, artistCount: artists.length, trackCount: tracks.length, duration },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[sync] Erro:', error);
    syncStatus = {
      running: false,
      lastResult: { success: false, artistCount: 0, trackCount: 0, duration: Date.now() - start, error },
    };
  }
}

export default router;
