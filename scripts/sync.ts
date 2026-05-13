/**
 * Script de sincronização standalone.
 * Roda via GitHub Actions ou manualmente.
 *
 * Variáveis de ambiente necessárias:
 *   LASTFM_USERNAME  — username do Last.fm
 *   LASTFM_API_KEY   — API key do Last.fm
 *   MAX_PAGES        — (opcional) limite de páginas, 0 = sem limite
 *
 * Saída: frontend/public/data/snapshots/YYYY-MM-DD.json
 *        frontend/public/data/config.json (atualiza lastSync)
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../frontend/public/data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const API_BASE = 'http://ws.audioscrobbler.com/2.0/';

// ── Config ───────────────────────────────────────────────────────────────────

const USERNAME = process.env.LASTFM_USERNAME ?? '';
const API_KEY = process.env.LASTFM_API_KEY ?? '';
const MAX_PAGES = parseInt(process.env.MAX_PAGES ?? '0', 10);

if (!USERNAME || !API_KEY) {
  console.error('Erro: LASTFM_USERNAME e LASTFM_API_KEY são obrigatórios.');
  process.exit(1);
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ArtistEntry {
  rank: number;
  name: string;
  scrobbles: number;
  url: string;
  imageUrl: string;
}

interface TrackEntry {
  rank: number;
  name: string;
  artist: string;
  scrobbles: number;
  url: string;
  imageUrl: string;
}

interface Snapshot {
  date: string;
  username: string;
  syncedAt: string;
  artists: ArtistEntry[];
  tracks: TrackEntry[];
}

interface PublicConfig {
  username: string;
  lastSync: string;
}

// ── API Last.fm ───────────────────────────────────────────────────────────────

async function apiGet<T>(method: string, extra: Record<string, string | number> = {}): Promise<T> {
  const res = await axios.get<T>(API_BASE, {
    params: { method, user: USERNAME, api_key: API_KEY, format: 'json', limit: 1000, period: 'overall', ...extra },
    timeout: 20000,
  });
  return res.data;
}

async function fetchArtists(): Promise<ArtistEntry[]> {
  const out: ArtistEntry[] = [];

  interface Resp {
    topartists: {
      artist: Array<{ name: string; playcount: string; url: string; image: Array<{ '#text': string; size: string }> }>;
      '@attr': { totalPages: string };
    };
  }

  const first = await apiGet<Resp>('user.gettopartists');
  const totalPages = parseInt(first.topartists['@attr'].totalPages, 10);
  const limit = MAX_PAGES > 0 ? Math.min(MAX_PAGES, totalPages) : totalPages;

  const parseArtists = (arr: Resp['topartists']['artist']) => {
    const base = out.length;
    arr.forEach((a, i) => {
      const img = a.image?.find(im => im.size === 'medium' || im.size === 'large');
      out.push({ rank: base + i + 1, name: a.name, scrobbles: parseInt(a.playcount, 10) || 0, url: a.url, imageUrl: img?.['#text'] ?? '' });
    });
  };

  parseArtists(first.topartists.artist);
  console.log(`  Artistas: 1/${limit}`);

  for (let page = 2; page <= limit; page++) {
    const data = await apiGet<Resp>('user.gettopartists', { page });
    parseArtists(data.topartists.artist);
    console.log(`  Artistas: ${page}/${limit}`);
  }

  return out;
}

async function fetchTracks(): Promise<TrackEntry[]> {
  const out: TrackEntry[] = [];

  interface Resp {
    toptracks: {
      track: Array<{ name: string; playcount: string; url: string; artist: { name: string }; image: Array<{ '#text': string; size: string }> }>;
      '@attr': { totalPages: string };
    };
  }

  const first = await apiGet<Resp>('user.gettoptracks');
  const totalPages = parseInt(first.toptracks['@attr'].totalPages, 10);
  const limit = MAX_PAGES > 0 ? Math.min(MAX_PAGES, totalPages) : totalPages;

  const parseTracks = (arr: Resp['toptracks']['track']) => {
    const base = out.length;
    arr.forEach((t, i) => {
      const img = t.image?.find(im => im.size === 'medium' || im.size === 'large');
      out.push({ rank: base + i + 1, name: t.name, artist: t.artist?.name ?? '', scrobbles: parseInt(t.playcount, 10) || 0, url: t.url, imageUrl: img?.['#text'] ?? '' });
    });
  };

  parseTracks(first.toptracks.track);
  console.log(`  Músicas: 1/${limit}`);

  for (let page = 2; page <= limit; page++) {
    const data = await apiGet<Resp>('user.gettoptracks', { page });
    parseTracks(data.toptracks.track);
    console.log(`  Músicas: ${page}/${limit}`);
  }

  return out;
}

// ── Storage ───────────────────────────────────────────────────────────────────

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

function writeSnapshot(snapshot: Snapshot) {
  const file = path.join(SNAPSHOTS_DIR, `${snapshot.date}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`  Snapshot salvo: ${file}`);

  // Atualiza index.json com todas as datas disponíveis
  const dates = listSnapshotDates();
  const indexFile = path.join(SNAPSHOTS_DIR, 'index.json');
  fs.writeFileSync(indexFile, JSON.stringify({ dates }, null, 2), 'utf-8');
}

function updatePublicConfig() {
  const existing: PublicConfig = fs.existsSync(CONFIG_FILE)
    ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    : { username: USERNAME, lastSync: '' };

  const updated: PublicConfig = { username: USERNAME, lastSync: new Date().toISOString() };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

function listSnapshotDates(): string[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return [];
  return fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  ensureDirs();

  const start = Date.now();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n🎵 Last.fm Sync — @${USERNAME} — ${today}`);
  console.log('─'.repeat(40));

  // Verifica se já existe snapshot de hoje
  const existing = listSnapshotDates();
  if (existing.includes(today)) {
    console.log(`⚠ Já existe snapshot para hoje (${today}). Sobrescrevendo...`);
  }

  console.log('\n📊 Buscando artistas...');
  const artists = await fetchArtists();

  console.log('\n🎵 Buscando músicas...');
  const tracks = await fetchTracks();

  const snapshot: Snapshot = {
    date: today,
    username: USERNAME,
    syncedAt: new Date().toISOString(),
    artists,
    tracks,
  };

  writeSnapshot(snapshot);
  updatePublicConfig();

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Concluído em ${duration}s`);
  console.log(`   ${artists.length} artistas · ${tracks.length} músicas`);
  console.log(`   Total de snapshots: ${listSnapshotDates().length}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro no sync:', err.message ?? err);
  process.exit(1);
});
