import axios from 'axios';
import { ArtistEntry } from '../types';

const API_BASE = 'http://ws.audioscrobbler.com/2.0/';

interface LastFmArtist {
  name: string;
  playcount: string;
  url: string;
  '@attr': { rank: string };
  image: Array<{ '#text': string; size: string }>;
}

interface LastFmTopArtistsResponse {
  topartists: {
    artist: LastFmArtist[];
    '@attr': { page: string; totalPages: string; total: string };
  };
}

export async function fetchArtists(
  username: string,
  apiKey: string,
  maxPages: number,
  onProgress?: (page: number, total: number) => void
): Promise<ArtistEntry[]> {
  const artists: ArtistEntry[] = [];

  // Busca primeira página para descobrir total
  const first = await fetchArtistsPage(username, apiKey, 1);
  const totalPages = parseInt(first.topartists['@attr'].totalPages, 10);
  const limit = maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages;

  parseArtists(first.topartists.artist, artists);
  onProgress?.(1, limit);

  for (let page = 2; page <= limit; page++) {
    const data = await fetchArtistsPage(username, apiKey, page);
    parseArtists(data.topartists.artist, artists);
    onProgress?.(page, limit);
  }

  return artists;
}

async function fetchArtistsPage(
  username: string,
  apiKey: string,
  page: number
): Promise<LastFmTopArtistsResponse> {
  const res = await axios.get<LastFmTopArtistsResponse>(API_BASE, {
    params: {
      method: 'user.gettopartists',
      user: username,
      api_key: apiKey,
      format: 'json',
      limit: 1000, // máximo permitido pela API
      page,
      period: 'overall',
    },
    timeout: 15000,
  });

  if (!res.data?.topartists) {
    throw new Error(`Resposta inesperada da API: ${JSON.stringify(res.data)}`);
  }

  return res.data;
}

function parseArtists(raw: LastFmArtist[], out: ArtistEntry[]): void {
  if (!Array.isArray(raw)) return;
  const base = out.length;
  raw.forEach((a, i) => {
    const img = a.image?.find(im => im.size === 'medium' || im.size === 'large');
    out.push({
      rank: base + i + 1,
      name: a.name,
      scrobbles: parseInt(a.playcount, 10) || 0,
      url: a.url,
      imageUrl: img?.['#text'] ?? '',
    });
  });
}
