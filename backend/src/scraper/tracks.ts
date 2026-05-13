import axios from 'axios';
import { TrackEntry } from '../types';

const API_BASE = 'http://ws.audioscrobbler.com/2.0/';

interface LastFmTrack {
  name: string;
  playcount: string;
  url: string;
  '@attr': { rank: string };
  artist: { name: string; url: string };
  image: Array<{ '#text': string; size: string }>;
}

interface LastFmTopTracksResponse {
  toptracks: {
    track: LastFmTrack[];
    '@attr': { page: string; totalPages: string; total: string };
  };
}

export async function fetchTracks(
  username: string,
  apiKey: string,
  maxPages: number,
  onProgress?: (page: number, total: number) => void
): Promise<TrackEntry[]> {
  const tracks: TrackEntry[] = [];

  const first = await fetchTracksPage(username, apiKey, 1);
  const totalPages = parseInt(first.toptracks['@attr'].totalPages, 10);
  const limit = maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages;

  parseTracks(first.toptracks.track, tracks);
  onProgress?.(1, limit);

  for (let page = 2; page <= limit; page++) {
    const data = await fetchTracksPage(username, apiKey, page);
    parseTracks(data.toptracks.track, tracks);
    onProgress?.(page, limit);
  }

  return tracks;
}

async function fetchTracksPage(
  username: string,
  apiKey: string,
  page: number
): Promise<LastFmTopTracksResponse> {
  const res = await axios.get<LastFmTopTracksResponse>(API_BASE, {
    params: {
      method: 'user.gettoptracks',
      user: username,
      api_key: apiKey,
      format: 'json',
      limit: 1000,
      page,
      period: 'overall',
    },
    timeout: 15000,
  });

  if (!res.data?.toptracks) {
    throw new Error(`Resposta inesperada da API: ${JSON.stringify(res.data)}`);
  }

  return res.data;
}

function parseTracks(raw: LastFmTrack[], out: TrackEntry[]): void {
  if (!Array.isArray(raw)) return;
  const base = out.length;
  raw.forEach((t, i) => {
    const img = t.image?.find(im => im.size === 'medium' || im.size === 'large');
    out.push({
      rank: base + i + 1,
      name: t.name,
      artist: t.artist?.name ?? '',
      scrobbles: parseInt(t.playcount, 10) || 0,
      url: t.url,
      imageUrl: img?.['#text'] ?? '',
    });
  });
}
