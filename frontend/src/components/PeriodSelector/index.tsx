import { useState } from 'react';
import type { RankingParams } from '@/hooks/useRanking';

interface PeriodSelectorProps {
  params: RankingParams;
  snapshots: string[]; // datas disponíveis YYYY-MM-DD
  onChange: (params: RankingParams) => void;
  compareDate?: string; // data efetivamente usada como base
}

const PERIOD_PRESETS = [
  { label: 'Anterior', value: '' },       // default: snapshot anterior
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '3 meses', value: '90d' },
  { label: '6 meses', value: '180d' },
  { label: '1 ano', value: '365d' },
  { label: 'Desde sempre', value: 'all' },
  { label: 'Data...', value: 'custom' },
];

export function PeriodSelector({ params, snapshots, onChange, compareDate }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);

  const activePeriod = params.compareWith ? 'custom' : (params.period ?? '');

  const handlePreset = (value: string) => {
    if (value === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(value === '' ? {} : { period: value });
  };

  const handleCustomDate = (date: string) => {
    onChange({ compareWith: date });
  };

  // Formata a data de comparação para exibição amigável
  const formatCompareDate = (date: string) => {
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-lastfm-muted text-xs mr-1 whitespace-nowrap">Comparar com:</span>
        {PERIOD_PRESETS.map(preset => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activePeriod === preset.value
                ? 'bg-lastfm-red text-white'
                : 'bg-lastfm-card border border-lastfm-border text-lastfm-muted hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Seletor de data customizada */}
      {showCustom && snapshots.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap ml-1">
          <span className="text-lastfm-muted text-xs">Escolher snapshot:</span>
          <div className="flex gap-1 flex-wrap">
            {snapshots
              .slice(0, -1) // remove o mais recente (é o "atual")
              .slice()
              .reverse() // mais recente primeiro
              .map(date => (
                <button
                  key={date}
                  onClick={() => handleCustomDate(date)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    params.compareWith === date
                      ? 'bg-lastfm-red text-white'
                      : 'bg-lastfm-dark border border-lastfm-border text-lastfm-muted hover:text-white'
                  }`}
                >
                  {date}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Info sobre a comparação ativa */}
      {compareDate && (
        <div className="text-xs text-lastfm-muted ml-1">
          Mostrando diferenças desde{' '}
          <span className="text-white font-medium">{formatCompareDate(compareDate)}</span>
        </div>
      )}
    </div>
  );
}
