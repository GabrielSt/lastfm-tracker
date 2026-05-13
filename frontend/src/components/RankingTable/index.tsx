import { useState } from 'react';
import type { RankedArtist, RankedTrack } from '@/types';
import { TrendBadge } from '@/components/TrendBadge';
import { TrendChart } from '@/components/TrendChart';

const PAGE_SIZE = 50;

// Ponto verde pulsante para itens sendo ouvidos ativamente
function ActiveDot({ scrobbles }: { scrobbles: number }) {
  if (scrobbles <= 0) return null;
  return (
    <span
      title={`+${scrobbles.toLocaleString()} scrobbles in the period`}
      className="relative inline-flex shrink-0"
    >
      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-lastfm-border bg-lastfm-card/50 text-sm">
      <span className="text-lastfm-muted text-xs">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded-md text-lastfm-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-lastfm-muted">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`min-w-[28px] px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-lastfm-red text-white'
                    : 'text-lastfm-muted hover:text-white hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 rounded-md text-lastfm-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Artists Table ─────────────────────────────────────────────────────────────

interface ArtistsTableProps {
  artists: RankedArtist[];
  paginate?: boolean;
}

export function ArtistsTable({ artists, paginate = false }: ArtistsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paged = paginate ? artists.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : artists;

  const handlePageChange = (p: number) => {
    setPage(p);
    setExpanded(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-lastfm-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-lastfm-card/80 text-lastfm-muted text-xs uppercase tracking-wider">
            <th className="py-3 px-4 text-right w-12 font-medium">#</th>
            <th className="py-3 px-4 text-left font-medium">Artist</th>
            <th className="py-3 px-4 text-right font-medium">Scrobbles</th>
            <th className="py-3 px-4 text-right font-medium">Period</th>
            <th className="py-3 px-4 text-center w-24 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(artist => (
            <>
              <tr
                key={artist.name}
                className="border-t border-lastfm-border hover:bg-white/[0.03] cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === artist.name ? null : artist.name)}
              >
                <td className="py-3 px-4 text-right font-mono text-xs text-lastfm-muted tabular-nums">
                  {artist.rank}
                </td>
                <td className="py-3 px-4 max-w-0 w-full">
                  <div className="flex items-center gap-2.5">
                    <ActiveDot scrobbles={artist.newScrobbles ?? 0} />
                    <div className="min-w-0">
                      <a
                        href={artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-lastfm-red transition-colors block truncate"
                        onClick={e => e.stopPropagation()}
                        title={artist.name}
                      >
                        {artist.name}
                      </a>
                      {artist.previousRank !== undefined && artist.previousRank !== artist.rank && (
                        <div className="text-xs text-lastfm-muted">was #{artist.previousRank}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm tabular-nums whitespace-nowrap">
                  {artist.scrobbles.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                  {(artist.newScrobbles ?? 0) > 0 ? (
                    <span className="text-emerald-400">+{artist.newScrobbles!.toLocaleString()}</span>
                  ) : (
                    <span className="text-lastfm-muted">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <TrendBadge trend={artist.trend} delta={artist.delta} />
                </td>
              </tr>
              {expanded === artist.name && (
                <tr key={`${artist.name}-chart`} className="border-t border-lastfm-border bg-lastfm-dark/40">
                  <td colSpan={5} className="px-6 py-4">
                    <TrendChart name={artist.name} type="artist" />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {paginate && (
        <Pagination
          page={page}
          total={artists.length}
          pageSize={PAGE_SIZE}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
}

// ── Tracks Table ──────────────────────────────────────────────────────────────

interface TracksTableProps {
  tracks: RankedTrack[];
  paginate?: boolean;
}

export function TracksTable({ tracks, paginate = false }: TracksTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paged = paginate ? tracks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : tracks;

  const handlePageChange = (p: number) => {
    setPage(p);
    setExpanded(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-lastfm-border">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="bg-lastfm-card/80 text-lastfm-muted text-xs uppercase tracking-wider">
            <th className="py-3 px-4 text-right w-12 font-medium">#</th>
            <th className="py-3 px-4 text-left font-medium w-5/12">Track</th>
            <th className="py-3 px-4 text-left font-medium w-3/12">Artist</th>
            <th className="py-3 px-4 text-right font-medium w-24">Scrobbles</th>
            <th className="py-3 px-4 text-right font-medium w-20">Period</th>
            <th className="py-3 px-4 text-center w-24 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(track => {
            const key = `${track.artist}::${track.name}`;
            return (
              <>
                <tr
                  key={key}
                  className="border-t border-lastfm-border hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === key ? null : key)}
                >
                  <td className="py-3 px-4 text-right font-mono text-xs text-lastfm-muted tabular-nums">
                    {track.rank}
                  </td>
                  <td className="py-3 px-4 max-w-0">
                    <div className="flex items-center gap-2">
                      <ActiveDot scrobbles={track.newScrobbles ?? 0} />
                      <div className="min-w-0">
                        <a
                          href={track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-white hover:text-lastfm-red transition-colors block truncate"
                          onClick={e => e.stopPropagation()}
                          title={track.name}
                        >
                          {track.name}
                        </a>
                        {track.previousRank !== undefined && track.previousRank !== track.rank && (
                          <div className="text-xs text-lastfm-muted">was #{track.previousRank}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-0">
                    <span
                      className="text-lastfm-muted text-xs block truncate"
                      title={track.artist}
                    >
                      {track.artist}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {track.scrobbles.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                    {(track.newScrobbles ?? 0) > 0 ? (
                      <span className="text-emerald-400">+{track.newScrobbles!.toLocaleString()}</span>
                    ) : (
                      <span className="text-lastfm-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <TrendBadge trend={track.trend} delta={track.delta} />
                  </td>
                </tr>
                {expanded === key && (
                  <tr key={`${key}-chart`} className="border-t border-lastfm-border bg-lastfm-dark/40">
                    <td colSpan={6} className="px-6 py-4">
                      <TrendChart name={track.name} artist={track.artist} type="track" />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
      {paginate && (
        <Pagination
          page={page}
          total={tracks.length}
          pageSize={PAGE_SIZE}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
}
