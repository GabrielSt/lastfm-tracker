import type { RankedArtist, RankedTrack } from '@/types';
import { TrendBadge } from '@/components/TrendBadge';

// ── Shared ────────────────────────────────────────────────────────────────────

function TrendingCard({
  rank,
  name,
  sub,
  url,
  delta,
  scrobbles,
  newScrobbles,
  trend,
  isNew,
}: {
  rank: number;
  name: string;
  sub?: string;
  url: string;
  delta?: number;
  scrobbles: number;
  newScrobbles?: number;
  trend: RankedArtist['trend'];
  isNew?: boolean;
}) {
  const rising = trend === 'up';
  const falling = trend === 'down';

  return (
    <div
      className={`
        relative flex flex-col gap-2 p-4 rounded-xl border transition-colors
        ${rising ? 'border-emerald-500/30 bg-emerald-500/5' : ''}
        ${falling ? 'border-rose-500/30 bg-rose-500/5' : ''}
        ${isNew ? 'border-amber-500/30 bg-amber-500/5' : ''}
        ${!rising && !falling && !isNew ? 'border-lastfm-border bg-lastfm-card' : ''}
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-lastfm-muted shrink-0">#{rank}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-lastfm-red transition-colors truncate text-sm"
            title={name}
          >
            {name}
          </a>
        </div>
        <TrendBadge trend={trend} delta={delta} />
      </div>

      {/* Artist name for tracks */}
      {sub && (
        <div className="text-xs text-lastfm-muted truncate -mt-1">{sub}</div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-lastfm-muted tabular-nums">
          {scrobbles.toLocaleString()} total
        </span>
        {(newScrobbles ?? 0) > 0 && (
          <span className="text-emerald-400 tabular-nums font-medium">
            +{newScrobbles!.toLocaleString()} recent
          </span>
        )}
      </div>

      {/* Delta bar — visual indicator of magnitude */}
      {delta !== undefined && delta !== 0 && (
        <div className="h-0.5 rounded-full bg-lastfm-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${rising ? 'bg-emerald-400' : 'bg-rose-400'}`}
            style={{ width: `${Math.min(100, (Math.abs(delta) / 50) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function EmptyTrending({ message }: { message: string }) {
  return (
    <div className="col-span-full py-12 text-center text-lastfm-muted text-sm">
      {message}
    </div>
  );
}

// ── Artists Trending ──────────────────────────────────────────────────────────

export function ArtistsTrending({ artists }: { artists: RankedArtist[] }) {
  const hasComparison = artists.some(a => a.trend !== 'stable' && a.trend !== 'unknown');

  const rising = [...artists]
    .filter(a => a.trend === 'up')
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 12);

  const falling = [...artists]
    .filter(a => a.trend === 'down')
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 8);

  const newEntries = artists.filter(a => a.trend === 'new').slice(0, 8);

  const biggestGainers = [...artists]
    .filter(a => (a.newScrobbles ?? 0) > 0)
    .sort((a, b) => (b.newScrobbles ?? 0) - (a.newScrobbles ?? 0))
    .slice(0, 8);

  if (!hasComparison) {
    return (
      <div className="py-16 text-center text-lastfm-muted text-sm">
        Trending requires at least 2 syncs to compare.
        <br />
        <span className="text-xs mt-1 block opacity-60">Check back tomorrow after the daily sync runs.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rising */}
      <section>
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>▲</span> Rising
          <span className="text-lastfm-muted font-normal normal-case tracking-normal">biggest rank gains</span>
        </h3>
        {rising.length === 0 ? (
          <EmptyTrending message="No rising artists in this period." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rising.map(a => (
              <TrendingCard key={a.name} rank={a.rank} name={a.name} url={a.url}
                delta={a.delta} scrobbles={a.scrobbles} newScrobbles={a.newScrobbles} trend={a.trend} />
            ))}
          </div>
        )}
      </section>

      {/* Most active */}
      {biggestGainers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⟳</span> Most Active
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">most scrobbles in the period</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {biggestGainers.map(a => (
              <TrendingCard key={a.name} rank={a.rank} name={a.name} url={a.url}
                delta={a.delta} scrobbles={a.scrobbles} newScrobbles={a.newScrobbles} trend={a.trend} />
            ))}
          </div>
        </section>
      )}

      {/* New entries */}
      {newEntries.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>★</span> New Entries
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">not in the previous snapshot</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {newEntries.map(a => (
              <TrendingCard key={a.name} rank={a.rank} name={a.name} url={a.url}
                delta={a.delta} scrobbles={a.scrobbles} newScrobbles={a.newScrobbles} trend={a.trend} isNew />
            ))}
          </div>
        </section>
      )}

      {/* Falling */}
      {falling.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>▼</span> Falling
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">biggest rank drops</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {falling.map(a => (
              <TrendingCard key={a.name} rank={a.rank} name={a.name} url={a.url}
                delta={a.delta} scrobbles={a.scrobbles} newScrobbles={a.newScrobbles} trend={a.trend} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Tracks Trending ───────────────────────────────────────────────────────────

export function TracksTrending({ tracks }: { tracks: RankedTrack[] }) {
  const hasComparison = tracks.some(a => a.trend !== 'stable' && a.trend !== 'unknown');

  const rising = [...tracks]
    .filter(t => t.trend === 'up')
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 12);

  const newEntries = tracks.filter(t => t.trend === 'new').slice(0, 8);

  const biggestGainers = [...tracks]
    .filter(t => (t.newScrobbles ?? 0) > 0)
    .sort((a, b) => (b.newScrobbles ?? 0) - (a.newScrobbles ?? 0))
    .slice(0, 8);

  const falling = [...tracks]
    .filter(t => t.trend === 'down')
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 8);

  if (!hasComparison) {
    return (
      <div className="py-16 text-center text-lastfm-muted text-sm">
        Trending requires at least 2 syncs to compare.
        <br />
        <span className="text-xs mt-1 block opacity-60">Check back tomorrow after the daily sync runs.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rising.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>▲</span> Rising
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">biggest rank gains</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rising.map(t => (
              <TrendingCard key={`${t.artist}::${t.name}`} rank={t.rank} name={t.name} sub={t.artist}
                url={t.url} delta={t.delta} scrobbles={t.scrobbles} newScrobbles={t.newScrobbles} trend={t.trend} />
            ))}
          </div>
        </section>
      )}

      {biggestGainers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⟳</span> Most Active
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">most plays in the period</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {biggestGainers.map(t => (
              <TrendingCard key={`${t.artist}::${t.name}`} rank={t.rank} name={t.name} sub={t.artist}
                url={t.url} delta={t.delta} scrobbles={t.scrobbles} newScrobbles={t.newScrobbles} trend={t.trend} />
            ))}
          </div>
        </section>
      )}

      {newEntries.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>★</span> New Entries
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">not in the previous snapshot</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {newEntries.map(t => (
              <TrendingCard key={`${t.artist}::${t.name}`} rank={t.rank} name={t.name} sub={t.artist}
                url={t.url} delta={t.delta} scrobbles={t.scrobbles} newScrobbles={t.newScrobbles} trend={t.trend} isNew />
            ))}
          </div>
        </section>
      )}

      {falling.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>▼</span> Falling
            <span className="text-lastfm-muted font-normal normal-case tracking-normal">biggest rank drops</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {falling.map(t => (
              <TrendingCard key={`${t.artist}::${t.name}`} rank={t.rank} name={t.name} sub={t.artist}
                url={t.url} delta={t.delta} scrobbles={t.scrobbles} newScrobbles={t.newScrobbles} trend={t.trend} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
