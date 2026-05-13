import { useState } from 'react';
import type { RankedArtist, RankedTrack } from '@/types';
import { TrendBadge } from '@/components/TrendBadge';
import { TrendChart } from '@/components/TrendChart';

// Ponto verde pulsante para itens sendo ouvidos ativamente
function ActiveBadge({ scrobbles }: { scrobbles: number }) {
  if (scrobbles <= 0) return null;
  return (
    <span
      title={`+${scrobbles.toLocaleString('pt-BR')} scrobbles no período`}
      className="relative inline-flex"
    >
      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

// ── Artists Table ────────────────────────────────────────────────────────────

interface ArtistsTableProps {
  artists: RankedArtist[];
}

export function ArtistsTable({ artists }: ArtistsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-lastfm-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-lastfm-card text-lastfm-muted text-xs uppercase tracking-wider">
            <th className="py-3 px-4 text-right w-12">#</th>
            <th className="py-3 px-4 text-left">Artista</th>
            <th className="py-3 px-4 text-right">Total</th>
            <th className="py-3 px-4 text-right">Período</th>
            <th className="py-3 px-4 text-center w-28">Evolução</th>
          </tr>
        </thead>
        <tbody>
          {artists.map(artist => (
            <>
              <tr
                key={artist.name}
                className="border-t border-lastfm-border hover:bg-white/5 cursor-pointer transition-colors group"
                onClick={() => setExpanded(expanded === artist.name ? null : artist.name)}
              >
                <td className="py-3 px-4 text-right font-mono text-lastfm-muted">
                  {artist.rank}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {artist.imageUrl && (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-8 h-8 rounded-full object-cover opacity-80 shrink-0"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Ponto verde pulsante se ouvindo no período */}
                        {(artist.newScrobbles ?? 0) > 0 && (
                          <ActiveBadge scrobbles={artist.newScrobbles!} />
                        )}
                        <a
                          href={artist.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-lastfm-red transition-colors truncate"
                          onClick={e => e.stopPropagation()}
                        >
                          {artist.name}
                        </a>
                      </div>
                      {artist.previousRank !== undefined && artist.previousRank !== artist.rank && (
                        <div className="text-xs text-lastfm-muted">
                          era #{artist.previousRank}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm">
                  {artist.scrobbles.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs">
                  {artist.newScrobbles !== undefined ? (
                    artist.newScrobbles > 0 ? (
                      <span className="text-emerald-400">+{artist.newScrobbles.toLocaleString('pt-BR')}</span>
                    ) : (
                      <span className="text-lastfm-muted">—</span>
                    )
                  ) : (
                    <span className="text-lastfm-muted">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <TrendBadge trend={artist.trend} delta={artist.delta} />
                </td>
              </tr>
              {expanded === artist.name && (
                <tr key={`${artist.name}-chart`} className="bg-lastfm-dark/60 border-t border-lastfm-border">
                  <td colSpan={5} className="px-6 py-4">
                    <TrendChart name={artist.name} type="artist" />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tracks Table ─────────────────────────────────────────────────────────────

interface TracksTableProps {
  tracks: RankedTrack[];
}

export function TracksTable({ tracks }: TracksTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-lastfm-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-lastfm-card text-lastfm-muted text-xs uppercase tracking-wider">
            <th className="py-3 px-4 text-right w-12">#</th>
            <th className="py-3 px-4 text-left">Música</th>
            <th className="py-3 px-4 text-left">Artista</th>
            <th className="py-3 px-4 text-right">Total</th>
            <th className="py-3 px-4 text-right">Período</th>
            <th className="py-3 px-4 text-center w-28">Evolução</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map(track => {
            const key = `${track.artist}::${track.name}`;
            return (
              <>
                <tr
                  key={key}
                  className="border-t border-lastfm-border hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === key ? null : key)}
                >
                  <td className="py-3 px-4 text-right font-mono text-lastfm-muted">
                    {track.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        {(track.newScrobbles ?? 0) > 0 && (
                          <ActiveBadge scrobbles={track.newScrobbles!} />
                        )}
                        <a
                          href={track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-lastfm-red transition-colors truncate"
                          onClick={e => e.stopPropagation()}
                        >
                          {track.name}
                        </a>
                      </div>
                      {track.previousRank !== undefined && track.previousRank !== track.rank && (
                        <div className="text-xs text-lastfm-muted">era #{track.previousRank}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-lastfm-muted text-xs">{track.artist}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    {track.scrobbles.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs">
                    {track.newScrobbles !== undefined ? (
                      track.newScrobbles > 0 ? (
                        <span className="text-emerald-400">+{track.newScrobbles.toLocaleString('pt-BR')}</span>
                      ) : (
                        <span className="text-lastfm-muted">—</span>
                      )
                    ) : (
                      <span className="text-lastfm-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <TrendBadge trend={track.trend} delta={track.delta} />
                  </td>
                </tr>
                {expanded === key && (
                  <tr key={`${key}-chart`} className="bg-lastfm-dark/60 border-t border-lastfm-border">
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
    </div>
  );
}
