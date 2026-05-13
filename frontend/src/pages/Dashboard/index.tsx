import { useRanking } from '@/hooks/useRanking';
import { SyncButton } from '@/components/SyncButton';
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
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          {data && (
            <p className="text-lastfm-muted text-sm">
              @{data.current.username} · sincronizado em{' '}
              {new Date(data.current.syncedAt).toLocaleString('pt-BR')}
            </p>
          )}
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

      {/* Estado vazio / erro */}
      {error && (
        <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl p-6 text-center">
          <div className="text-rose-400 text-lg mb-2">⚠</div>
          <p className="text-rose-300">{error}</p>
          {error.includes('backend') && (
            <p className="text-lastfm-muted text-sm mt-2">
              Rode <code className="bg-black/30 px-1 rounded">npm run dev</code> na pasta raiz do projeto.
            </p>
          )}
          {error.includes('sincronização') && (
            <p className="text-lastfm-muted text-sm mt-2">
              Configure seu username em{' '}
              <Link to="/settings" className="text-lastfm-red underline">
                Configurações
              </Link>{' '}
              e clique em Sincronizar.
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48 text-lastfm-muted">
          Carregando...
        </div>
      )}

      {data && (
        <>
          {/* Stats rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Artistas" value={data.current.artists.length} />
            <StatCard label="Músicas" value={data.current.tracks.length} />
            <StatCard
              label="Subindo ↑"
              value={data.artists.filter(a => a.trend === 'up').length}
              color="text-emerald-400"
            />
            <StatCard
              label="Descendo ↓"
              value={data.artists.filter(a => a.trend === 'down').length}
              color="text-rose-400"
            />
          </div>

          {/* Legenda */}
          {data.compareDate && (
            <div className="flex items-center gap-4 text-xs text-lastfm-muted">
              <div className="flex items-center gap-1.5">
                <span className="relative inline-flex">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Ouvindo no período comparado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold text-xs">▲</span> Subiu de posição
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-bold text-xs">▼</span> Desceu de posição
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold text-xs">NEW</span> Não estava no ranking
              </div>
            </div>
          )}

          {/* Top 10 artistas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Top Artistas</h2>
              <Link to="/artists" className="text-sm text-lastfm-red hover:underline">
                Ver todos →
              </Link>
            </div>
            <ArtistsTable artists={data.artists.slice(0, 10)} />
          </section>

          {/* Top 10 músicas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Top Músicas</h2>
              <Link to="/tracks" className="text-sm text-lastfm-red hover:underline">
                Ver todos →
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
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-lastfm-card border border-lastfm-border rounded-xl p-4">
      <div className="text-lastfm-muted text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</div>
    </div>
  );
}
