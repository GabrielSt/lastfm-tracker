import { useEffect, useMemo, useState } from 'react';
import { getSnapshot, getSnapshots } from '@/api';
import type { Snapshot } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';

// ── Palette ───────────────────────────────────────────────────────────────────

const RED = '#e8190c';
const MUTED = '#71717a';
const BORDER = '#2a2a2f';
const CARD = '#1a1a1e';
const DARK = '#111113';

// ── Shared components ─────────────────────────────────────────────────────────

function Section({ title, subtitle, children, action }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-lastfm-card border border-lastfm-border rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-lastfm-muted text-xs mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TabBar<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 bg-lastfm-dark rounded-lg p-1 w-fit">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === o.value ? 'bg-lastfm-red text-white' : 'text-lastfm-muted hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 },
  labelStyle: { color: MUTED },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

// ── 1. Most Played ────────────────────────────────────────────────────────────
// Bar chart — top N artists or tracks by all-time scrobbles

function MostPlayed({ snapshot }: { snapshot: Snapshot }) {
  const [mode, setMode] = useState<'artists' | 'tracks'>('artists');
  const [topN, setTopN] = useState(20);

  const data = useMemo(() => {
    const items = mode === 'artists' ? snapshot.artists : snapshot.tracks;
    return items.slice(0, topN).map(item => ({
      name: 'artist' in item ? item.name : `${item.name} — ${'artist' in item ? '' : (item as any).artist}`,
      label: item.name,
      scrobbles: item.scrobbles,
    }));
  }, [snapshot, mode, topN]);

  const maxVal = data[0]?.scrobbles ?? 1;

  return (
    <Section
      title="Most Played"
      subtitle="All-time scrobble count for your top artists and tracks"
      action={
        <TabBar
          value={mode}
          options={[{ value: 'artists', label: 'Artists' }, { value: 'tracks', label: 'Tracks' }]}
          onChange={setMode}
        />
      }
    >
      {/* Top N selector */}
      <div className="flex gap-1">
        {([10, 20, 50] as const).map(n => (
          <button
            key={n}
            onClick={() => setTopN(n)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              topN === n ? 'text-white bg-lastfm-border' : 'text-lastfm-muted hover:text-white'
            }`}
          >
            Top {n}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={topN * 28 + 20}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: MUTED, fontSize: 11 }}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tick={{ fill: '#d4d4d8', fontSize: 11 }}
            tickFormatter={v => v.length > 22 ? v.slice(0, 20) + '…' : v}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [v.toLocaleString(), 'scrobbles']}
          />
          <Bar dataKey="scrobbles" fill={RED} radius={[0, 4, 4, 0]} background={{ fill: DARK, radius: 4 }} />
        </BarChart>
      </ResponsiveContainer>

      {/* Top 1 callout */}
      <div className="text-xs text-lastfm-muted pt-1 border-t border-lastfm-border">
        #{1} <span className="text-white">{data[0]?.label}</span> has{' '}
        <span className="text-white font-mono">{data[0]?.scrobbles.toLocaleString()}</span> scrobbles
        {' '}— <span className="text-white">{((data[0]?.scrobbles / maxVal) * 100).toFixed(0)}%</span> of your top {topN}'s total
      </div>
    </Section>
  );
}

// ── 2. Period Comparison — gainers & losers ───────────────────────────────────
// Pick two snapshots and see who gained/lost the most scrobbles between them

function PeriodComparison({ snapshots, allDates }: {
  snapshots: Record<string, Snapshot>;
  allDates: string[];
}) {
  const [mode, setMode] = useState<'artists' | 'tracks'>('artists');
  const [fromDate, setFromDate] = useState(allDates[0]);
  const [toDate, setToDate] = useState(allDates[allDates.length - 1]);
  const [topN, setTopN] = useState(15);

  const { gainers, losers, newEntries, gone } = useMemo(() => {
    const from = snapshots[fromDate];
    const to = snapshots[toDate];
    if (!from || !to || fromDate === toDate) return { gainers: [], losers: [], newEntries: [], gone: [] };

    if (mode === 'artists') {
      const fromMap = new Map(from.artists.map(a => [a.name, a.scrobbles]));
      const toMap = new Map(to.artists.map(a => [a.name, a.scrobbles]));

      const diffs = to.artists.map(a => ({
        name: a.name,
        url: a.url,
        scrobbles: a.scrobbles,
        diff: a.scrobbles - (fromMap.get(a.name) ?? 0),
        isNew: !fromMap.has(a.name),
      }));

      const gone = from.artists
        .filter(a => !toMap.has(a.name))
        .map(a => ({ name: a.name, url: a.url, scrobbles: a.scrobbles, diff: -a.scrobbles, isNew: false }));

      return {
        gainers: diffs.filter(d => d.diff > 0 && !d.isNew).sort((a, b) => b.diff - a.diff).slice(0, topN),
        losers: diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, topN),
        newEntries: diffs.filter(d => d.isNew).slice(0, topN),
        gone: gone.slice(0, topN),
      };
    } else {
      const key = (name: string, artist: string) => `${artist}::${name}`;
      const fromMap = new Map(from.tracks.map(t => [key(t.name, t.artist), t.scrobbles]));
      const toMap = new Map(to.tracks.map(t => [key(t.name, t.artist), t.scrobbles]));

      const diffs = to.tracks.map(t => ({
        name: `${t.name}`,
        sub: t.artist,
        url: t.url,
        scrobbles: t.scrobbles,
        diff: t.scrobbles - (fromMap.get(key(t.name, t.artist)) ?? 0),
        isNew: !fromMap.has(key(t.name, t.artist)),
      }));

      const gone = from.tracks
        .filter(t => !toMap.has(key(t.name, t.artist)))
        .map(t => ({ name: t.name, sub: t.artist, url: t.url, scrobbles: t.scrobbles, diff: -t.scrobbles, isNew: false }));

      return {
        gainers: diffs.filter(d => d.diff > 0 && !d.isNew).sort((a, b) => b.diff - a.diff).slice(0, topN),
        losers: diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, topN),
        newEntries: diffs.filter(d => d.isNew).slice(0, topN),
        gone: gone.slice(0, topN),
      };
    }
  }, [snapshots, fromDate, toDate, mode, topN]);

  if (allDates.length < 2) {
    return (
      <Section title="Period Comparison" subtitle="Compare scrobble gains between two syncs">
        <div className="py-10 text-center text-lastfm-muted text-sm">
          Need at least 2 syncs to compare. Check back tomorrow.
        </div>
      </Section>
    );
  }

  const barData = gainers.slice(0, 15).map(g => ({ name: g.name, diff: g.diff }));

  return (
    <Section
      title="Period Comparison"
      subtitle="Who gained the most scrobbles between two snapshots"
      action={
        <TabBar
          value={mode}
          options={[{ value: 'artists', label: 'Artists' }, { value: 'tracks', label: 'Tracks' }]}
          onChange={setMode}
        />
      }
    >
      {/* Date pickers */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lastfm-muted text-xs">From</span>
          <select
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="bg-lastfm-dark border border-lastfm-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-lastfm-red"
          >
            {allDates.filter(d => d !== toDate).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <span className="text-lastfm-muted">→</span>
        <div className="flex items-center gap-2">
          <span className="text-lastfm-muted text-xs">To</span>
          <select
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="bg-lastfm-dark border border-lastfm-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-lastfm-red"
          >
            {allDates.filter(d => d !== fromDate).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 ml-auto">
          {([10, 15, 25] as const).map(n => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                topN === n ? 'text-white bg-lastfm-border' : 'text-lastfm-muted hover:text-white'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>

      {fromDate === toDate ? (
        <p className="text-lastfm-muted text-sm text-center py-6">Select two different dates to compare.</p>
      ) : (
        <div className="space-y-6">
          {/* Gainers bar chart */}
          {gainers.length > 0 && (
            <div>
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-3">
                ▲ Biggest Gainers
              </div>
              <ResponsiveContainer width="100%" height={barData.length * 28 + 20}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                  barSize={14}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                  <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={v => `+${v}`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    tickFormatter={v => v.length > 22 ? v.slice(0, 20) + '…' : v} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`+${v.toLocaleString()}`, 'new scrobbles']} />
                  <Bar dataKey="diff" fill="#22c55e" radius={[0, 4, 4, 0]} background={{ fill: DARK, radius: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Losers */}
          {losers.length > 0 && (
            <div>
              <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-3">
                ▼ Biggest Losers
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {losers.map((l: any) => (
                  <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-lastfm-dark border border-lastfm-border rounded-lg hover:border-rose-500/40 transition-colors"
                  >
                    <span className="text-xs text-white truncate">{l.name}</span>
                    <span className="text-xs font-mono text-rose-400 shrink-0">{l.diff.toLocaleString()}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* New entries */}
          {newEntries.length > 0 && (
            <div>
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-3">
                ★ New in ranking ({newEntries.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {newEntries.map((e: any) => (
                  <a key={e.name} href={e.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-full hover:bg-amber-400/20 transition-colors"
                  >
                    {e.name}
                    {'sub' in e && <span className="opacity-60 ml-1">— {(e as any).sub}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {gainers.length === 0 && losers.length === 0 && newEntries.length === 0 && (
            <p className="text-lastfm-muted text-sm text-center py-6">No differences found between these two snapshots.</p>
          )}
        </div>
      )}
    </Section>
  );
}

// ── 3. Snapshot Growth Timeline ───────────────────────────────────────────────
// Line chart — total scrobbles across all syncs

function GrowthTimeline({ snapshots, allDates }: {
  snapshots: Record<string, Snapshot>;
  allDates: string[];
}) {
  const data = useMemo(() =>
    allDates
      .filter(d => snapshots[d])
      .map(d => {
        const s = snapshots[d];
        const totalScrobbles = s.artists.reduce((sum, a) => sum + a.scrobbles, 0);
        const totalTracks = s.tracks.reduce((sum, t) => sum + t.scrobbles, 0);
        return {
          date: d.slice(5), // MM-DD
          fullDate: d,
          artists: s.artists.length,
          tracks: s.tracks.length,
          scrobbles: totalScrobbles,
          trackPlays: totalTracks,
        };
      }),
    [snapshots, allDates]
  );

  if (data.length < 2) {
    return (
      <Section title="Growth Timeline" subtitle="How your scrobble count evolves over time">
        <div className="py-10 text-center text-lastfm-muted text-sm">
          Need at least 2 syncs to show a timeline. Check back tomorrow.
        </div>
      </Section>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  const scrobbleGrowth = last.scrobbles - first.scrobbles;
  const artistGrowth = last.artists - first.artists;

  return (
    <Section
      title="Growth Timeline"
      subtitle="Total scrobbles and library size across all syncs"
    >
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total scrobbles', value: last.scrobbles.toLocaleString() },
          { label: `Since ${first.fullDate}`, value: scrobbleGrowth > 0 ? `+${scrobbleGrowth.toLocaleString()}` : '—', color: 'text-emerald-400' },
          { label: 'Artists tracked', value: last.artists.toLocaleString() },
          { label: 'Artist growth', value: artistGrowth > 0 ? `+${artistGrowth}` : '—', color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-lastfm-dark border border-lastfm-border rounded-lg p-3">
            <div className="text-xs text-lastfm-muted mb-1">{s.label}</div>
            <div className={`text-lg font-bold tabular-nums ${s.color ?? 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name: string) => [v.toLocaleString(), name === 'scrobbles' ? 'Total scrobbles' : 'Track plays']}
            labelFormatter={l => `Sync: ${l}`}
          />
          <Line type="monotone" dataKey="scrobbles" stroke={RED} strokeWidth={2} dot={{ fill: RED, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-lastfm-muted">This chart will become more interesting as more daily syncs accumulate.</p>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Reports() {
  const [allDates, setAllDates] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getSnapshots()
      .then(async dates => {
        setAllDates(dates);
        const loaded = await Promise.all(dates.map(d => getSnapshot(d).then(s => [d, s] as const)));
        setSnapshots(Object.fromEntries(loaded));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-lastfm-muted text-center py-20">Loading...</div>;
  if (error) return <div className="text-rose-400 text-center py-20">{error}</div>;

  const latest = allDates.length > 0 ? snapshots[allDates[allDates.length - 1]] : null;
  if (!latest) return <div className="text-lastfm-muted text-center py-20">No data yet. Run a sync first.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
        <p className="text-lastfm-muted text-sm">
          {allDates.length} sync{allDates.length !== 1 ? 's' : ''} · latest {allDates[allDates.length - 1]}
        </p>
      </div>

      <MostPlayed snapshot={latest} />
      <PeriodComparison snapshots={snapshots} allDates={allDates} />
      <GrowthTimeline snapshots={snapshots} allDates={allDates} />
    </div>
  );
}
