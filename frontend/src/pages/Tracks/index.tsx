import { useState } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { SyncButton } from '@/components/SyncButton';
import { TracksTable } from '@/components/RankingTable';
import { PeriodSelector } from '@/components/PeriodSelector';

export default function Tracks() {
  const { data, loading, error, refetch, changeParams, params, snapshots } = useRanking();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'new' | 'active'>('all');

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Músicas</h1>
          <p className="text-lastfm-muted text-sm">
            {filtered.length} de {tracks.length} músicas
          </p>
        </div>
        <SyncButton onSyncComplete={refetch} />
      </div>

      {/* Seletor de período */}
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

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar música ou artista..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-lastfm-card border border-lastfm-border rounded-lg px-3 py-1.5 text-white placeholder-lastfm-muted focus:outline-none focus:border-lastfm-red text-sm"
        />
        <div className="flex gap-1 flex-wrap">
          {([
            { value: 'all', label: 'Todos' },
            { value: 'active', label: '● Ouvindo' },
            { value: 'up', label: '↑ Subindo' },
            { value: 'down', label: '↓ Descendo' },
            { value: 'new', label: '★ Novos' },
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

      {loading && <div className="text-lastfm-muted text-center py-20">Carregando...</div>}
      {error && <div className="text-rose-400 text-center py-20">{error}</div>}
      {!loading && !error && <TracksTable tracks={filtered} />}
    </div>
  );
}
