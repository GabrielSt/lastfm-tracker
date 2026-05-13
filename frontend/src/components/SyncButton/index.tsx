import { useSync } from '@/hooks/useSync';
import { Link } from 'react-router-dom';

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

const IS_DEV = import.meta.env.DEV;

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { status, triggerSync } = useSync(onSyncComplete);
  const { running, progress, lastResult } = status;

  // Em produção não tem backend — sync é feito via GitHub Actions
  if (!IS_DEV) {
    return (
      <div className="text-xs text-lastfm-muted text-right">
        Sync automático via GitHub Actions
        <br />
        <a
          href={import.meta.env.VITE_GITHUB_ACTIONS_URL ?? 'https://github.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lastfm-red hover:underline"
        >
          Disparar manualmente ↗
        </a>
      </div>
    );
  }

  const progressLabel = (() => {
    if (!progress) return 'Sincronizando...';
    const phase = progress.phase === 'artists' ? 'Artistas' : 'Músicas';
    return progress.total
      ? `${phase}: ${progress.page}/${progress.total}`
      : `${phase}: página ${progress.page}`;
  })();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={triggerSync}
        disabled={running}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
          ${running
            ? 'bg-lastfm-border text-lastfm-muted cursor-not-allowed'
            : 'bg-lastfm-red hover:bg-red-600 text-white shadow-lg hover:shadow-lastfm-red/30'
          }
        `}
      >
        {running ? (
          <>
            <span className="animate-spin">⟳</span>
            {progressLabel}
          </>
        ) : (
          <>
            <span>⟳</span>
            Sincronizar
          </>
        )}
      </button>

      {lastResult && !running && (
        <span className={`text-xs max-w-xs text-right ${lastResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
          {lastResult.success
            ? `✓ ${lastResult.artistCount} artistas · ${lastResult.trackCount} músicas · ${(lastResult.duration / 1000).toFixed(0)}s`
            : lastResult.error?.includes('API key')
            ? <span>✗ API key não configurada — <Link to="/settings" className="underline">configure em Settings</Link></span>
            : `✗ ${lastResult.error}`}
        </span>
      )}
    </div>
  );
}
