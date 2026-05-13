// Tipos espelhados do backend (mantidos em sync manualmente)

export interface ArtistEntry {
  rank: number;
  name: string;
  scrobbles: number;
  url: string;
  imageUrl?: string;
}

export interface TrackEntry {
  rank: number;
  name: string;
  artist: string;
  scrobbles: number;
  url: string;
  imageUrl?: string;
}

export interface Snapshot {
  date: string;
  username: string;
  syncedAt: string;
  artists: ArtistEntry[];
  tracks: TrackEntry[];
}

export interface Config {
  username: string;
  apiKey: string;       // mascarado no retorno da API
  apiKeySet?: boolean;  // true se a chave está configurada
  maxPages: number;
  lastSync?: string;
}

export type Trend = 'up' | 'down' | 'stable' | 'new' | 'unknown';

export interface RankedArtist extends ArtistEntry {
  previousRank?: number;
  delta?: number;
  newScrobbles?: number;
  trend: Trend;
}

export interface RankedTrack extends TrackEntry {
  previousRank?: number;
  delta?: number;
  newScrobbles?: number;
  trend: Trend;
}

export interface RankingData {
  current: Snapshot;
  previous?: Snapshot;
  compareDate?: string;
  artists: RankedArtist[];
  tracks: RankedTrack[];
}

export interface SyncStatus {
  running: boolean;
  progress?: {
    phase: 'artists' | 'tracks';
    page: number;
    total?: number;
  };
  lastResult?: {
    success: boolean;
    artistCount: number;
    trackCount: number;
    duration: number;
    error?: string;
  };
}

export interface HistoryPoint {
  date: string;
  rank: number | null;
  scrobbles: number | null;
}
