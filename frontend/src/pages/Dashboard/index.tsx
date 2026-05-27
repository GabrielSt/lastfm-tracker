import { useRanking } from '@/hooks/useRanking';
import { ArtistsTable } from '@/components/RankingTable';
import { TracksTable } from '@/components/RankingTable';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data, loading, error, refetch, changeParams, params, snapshots } = useRanking();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Dashboard</h1>
          {data && (
            <p className="text-lastfm-muted text-sm">
              @{data.current.username} · synced{' '}
              {new Date(data.current.syncedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Period selector */}
      {snapshots.length > 1 && (
        <div className="bg-lastfm-card border border-lastfm-border rounded-xl p-4">
          <PeriodSelector
            params={params}
            snapshots={snapshots}
            onChange={changeParams}
            compareDate={data?.compareDate}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl p-6 text-center">
          <div className="text-rose-400 text-lg mb-2">⚠</div>
          <p className="text-rose-300">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48 text-lastfm-muted">
          Loading...
        </div>
      )}

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Artists" value={data.current.artists.length} />
            <StatCard label="Tracks" value={data.current.tracks.length} />
            <StatCard
              label="Rising ↑"
              value={data.artists.filter(a => a.trend === 'up').length}
              color="text-emerald-400"
              accent="border-emerald-400/20"
            />
            <StatCard
              label="Falling ↓"
              value={data.artists.filter(a => a.trend === 'down').length}
              color="text-rose-400"
              accent="border-rose-400/20"
            />
          </div>

          {/* Legend */}
          {data.compareDate && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-lastfm-muted">
              <div className="flex items-center gap-1.5">
                <span className="relative inline-flex">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Active in period
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">▲</span> Moved up
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">▼</span> Moved down
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold text-xs">NEW</span> Not previously ranked
              </div>
            </div>
          )}

          {/* Top artists */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Top Artists</h2>
              <Link to="/artists" className="text-sm text-lastfm-red hover:underline">
                View all →
              </Link>
            </div>
            <ArtistsTable artists={data.artists.slice(0, 10)} />
          </section>

          {/* Top tracks */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Top Tracks</h2>
              <Link to="/tracks" className="text-sm text-lastfm-red hover:underline">
                View all →
              </Link>
            </div>
            <TracksTable tracks={data.tracks.slice(0, 10)} />
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'text-white',
  accent = 'border-lastfm-border',
}: {
  label: string;
  value: number;
  color?: string;
  accent?: string;
}) {
  return (
    <div className={`bg-lastfm-card border rounded-xl p-4 ${accent}`}>
      <div className="text-lastfm-muted text-xs uppercase tracking-wider mb-2 font-medium">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{value.toLocaleString()}</div>
    </div>
  );
}
