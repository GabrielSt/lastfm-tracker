import { useState } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { ArtistsTable } from '@/components/RankingTable';
import { PeriodSelector } from '@/components/PeriodSelector';

export default function Artists() {
  const { data, loading, error, changeParams, params, snapshots } = useRanking();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'new' | 'active'>('all');

  const artists = data?.artists ?? [];

  const filtered = artists.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'up' && a.trend === 'up') ||
      (filter === 'down' && a.trend === 'down') ||
      (filter === 'new' && a.trend === 'new') ||
      (filter === 'active' && (a.newScrobbles ?? 0) > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Artists</h1>
        <p className="text-lastfm-muted text-sm">
          {filtered.length !== artists.length
            ? `${filtered.length} of ${artists.length} artists`
            : `${artists.length} artists`}
        </p>
      </div>

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

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search artist..."
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

      {loading && <div className="text-lastfm-muted text-center py-20">Loading...</div>}
      {error && <div className="text-rose-400 text-center py-20">{error}</div>}
      {!loading && !error && <ArtistsTable artists={filtered} paginate />}
    </div>
  );
}
