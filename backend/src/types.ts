// Tipos compartilhados entre backend e frontend

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
  date: string; // YYYY-MM-DD
  username: string;
  syncedAt: string; // ISO datetime
  artists: ArtistEntry[];
  tracks: TrackEntry[];
}

export interface Config {
  username: string;
  apiKey: string;
  maxPages: number; // 0 = sem limite
  lastSync?: string; // ISO datetime
}

export interface RankedArtist extends ArtistEntry {
  previousRank?: number;
  delta?: number; // positivo = subindo, negativo = descendo
  newScrobbles?: number; // scrobbles ganhos desde último snapshot
  trend: 'up' | 'down' | 'stable' | 'new' | 'unknown';
}

export interface RankedTrack extends TrackEntry {
  previousRank?: number;
  delta?: number;
  newScrobbles?: number;
  trend: 'up' | 'down' | 'stable' | 'new' | 'unknown';
}

export interface RankingData {
  current: Snapshot;
  previous?: Snapshot;
  compareDate?: string; // data usada como base de comparação
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
