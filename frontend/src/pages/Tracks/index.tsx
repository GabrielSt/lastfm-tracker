import { useState } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { TracksTable } from '@/components/RankingTable';
import { PeriodSelector } from '@/components/PeriodSelector';
import { TracksTrending } from '@/components/Trending';

type Tab = 'all' | 'trending';
type Filter = 'all' | 'up' | 'down' | 'new' | 'active';

export default function Tracks() {
  const { data, loading, error, changeParams, params, snapshots } = useRanking();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const tracks = data?.tracks ?? [];

  const filtered = tracks.filter(t => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'up' && t.trend === 'up') ||
      (filter === 'down' && t.trend === 'down') ||
      (filter === 'new' && t.trend === 'new') ||
      (filter === 'active' && (t.newScrobbles ?? 0) > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Tracks</h1>
        <p className="text-lastfm-muted text-sm">
          {tab === 'all'
            ? filtered.length !== tracks.length
              ? `${filtered.length} of ${tracks.length} tracks`
              : `${tracks.length} tracks`
            : `${tracks.filter(t => t.trend === 'up').length} rising · ${tracks.filter(t => t.trend === 'new').length} new`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-lastfm-border">
        {([
          { value: 'all', label: 'All Tracks' },
          { value: 'trending', label: '▲ Trending' },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.value
                ? 'border-lastfm-red text-white'
                : 'border-transparent text-lastfm-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
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

      {loading && <div className="text-lastfm-muted text-center py-20">Loading...</div>}
      {error && <div className="text-rose-400 text-center py-20">{error}</div>}

      {!loading && !error && tab === 'trending' && (
        <TracksTrending tracks={tracks} />
      )}

      {!loading && !error && tab === 'all' && (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search track or artist..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-lastfm-card border border-lastfm-border rounded-lg px-3 py-1.5 text-white placeholder-lastfm-muted focus:outline-none focus:border-lastfm-red text-sm min-w-48"
            />
            <div className="flex gap-1 flex-wrap">
              {([
                { value: 'all', label: 'All' },
                { value: 'active', label: '● Listening' },
                { value: 'up', label: '↑ Rising' },
                { value: 'down', label: '↓ Falling' },
                { value: 'new', label: '★ New' },
              ] as const).map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-lastfm-red text-white'
                      : 'bg-lastfm-card border border-lastfm-border text-lastfm-muted hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <TracksTable tracks={filtered} paginate />
        </>
      )}
    </div>
  );
}
