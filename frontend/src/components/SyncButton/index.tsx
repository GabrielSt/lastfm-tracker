import { useSync } from '@/hooks/useSync';

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

const IS_DEV = import.meta.env.DEV;

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { status, triggerSync } = useSync(onSyncComplete);
  const { running, progress, lastResult } = status;

  if (!IS_DEV) {
    return (
      <div className="text-xs text-lastfm-muted space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          Auto-sync via GitHub Actions
        </div>
        <a
          href={import.meta.env.VITE_GITHUB_ACTIONS_URL ?? 'https://github.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lastfm-red hover:underline block"
        >
          Run manually ↗
        </a>
      </div>
    );
  }

  const progressLabel = (() => {
    if (!progress) return 'Syncing...';
    const phase = progress.phase === 'artists' ? 'Artists' : 'Tracks';
    return progress.total
      ? `${phase}: ${progress.page}/${progress.total}`
      : `${phase}: page ${progress.page}`;
  })();

  return (
    <div className="space-y-2">
      <button
        onClick={triggerSync}
        disabled={running}
        className={`
          w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${running
            ? 'bg-lastfm-border text-lastfm-muted cursor-not-allowed'
            : 'bg-lastfm-red hover:bg-red-600 text-white'
          }
        `}
      >
        <span className={running ? 'animate-spin inline-block' : ''}>⟳</span>
        {running ? progressLabel : 'Sync now'}
      </button>

      {lastResult && !running && (
        <p className={`text-xs leading-tight ${lastResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
          {lastResult.success
            ? `✓ ${lastResult.artistCount} artists · ${lastResult.trackCount} tracks`
            : `✗ ${lastResult.error}`}
        </p>
      )}
    </div>
  );
}
