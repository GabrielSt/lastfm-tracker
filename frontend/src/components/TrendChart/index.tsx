import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getArtistHistory, getTrackHistory } from '@/api';
import type { HistoryPoint } from '@/types';

interface TrendChartProps {
  name: string;
  artist?: string;
  type: 'artist' | 'track';
}

export function TrendChart({ name, artist, type }: TrendChartProps) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch =
      type === 'artist'
        ? getArtistHistory(name)
        : getTrackHistory(name, artist ?? '');

    fetch
      .then(h => setData(h.filter(p => p.rank !== null)))
      .finally(() => setLoading(false));
  }, [name, artist, type]);

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-lastfm-muted text-sm">Carregando histórico...</div>;
  }

  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-lastfm-muted text-sm">
        Histórico insuficiente — sincronize mais vezes para ver a evolução.
      </div>
    );
  }

  // Inverte Y para rank 1 estar no topo
  const minRank = Math.min(...data.map(d => d.rank!));
  const maxRank = Math.max(...data.map(d => d.rank!));

  return (
    <div>
      <div className="text-xs text-lastfm-muted mb-2 uppercase tracking-wider">
        Evolução de posição
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8b8fa8', fontSize: 11 }}
            tickFormatter={d => d.slice(5)} // MM-DD
          />
          <YAxis
            reversed
            domain={[minRank - 1, maxRank + 1]}
            tick={{ fill: '#8b8fa8', fontSize: 11 }}
            allowDecimals={false}
            label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#8b8fa8', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: '#16213e', border: '1px solid #0f3460', borderRadius: 8 }}
            labelStyle={{ color: '#8b8fa8', fontSize: 12 }}
            formatter={(value: number) => [`#${value}`, 'Posição']}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#d51007"
            strokeWidth={2}
            dot={{ fill: '#d51007', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
