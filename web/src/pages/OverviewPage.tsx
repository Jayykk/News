import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartTooltip, XAxis, YAxis } from 'recharts';
import { Badge, Card, Group, Loader, Paper, SegmentedControl, Select, Stack, Text, Title } from '@mantine/core';
import { IconActivity, IconMoodSmile, IconMoodSad, IconShieldCheck } from '@tabler/icons-react';
import { apiClient } from '../api/client.js';
import { MetricCard } from '../components/MetricCard.js';
import { OverviewStats, TopSymbolStat } from '../types/api.js';

const calcFrom = (range: string) => {
  const now = Date.now();
  if (range === '7d') return new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  if (range === '72h') return new Date(now - 72 * 3600 * 1000).toISOString();
  return new Date(now - 24 * 3600 * 1000).toISOString();
};

const ratioText = (rumor: number, official: number) => {
  if (official === 0) return 'N/A';
  const ratio = rumor / Math.max(official, 1);
  return `${(ratio * 100).toFixed(1)}% rumor`; // stub metric until backend ships richer veracity data
};

const TopSymbols = ({ data }: { data: TopSymbolStat[] }) => (
  <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800">
    <Group justify="space-between" mb="sm">
      <Title order={5}>Top symbols by alert volume</Title>
      <Badge color="cyan">auto-updated</Badge>
    </Group>
    <Stack gap="xs">
      {data.map((sym) => {
        const total = sym.total || 1;
        const bullishRatio = Math.round((sym.bullish / total) * 100);
        const bearishRatio = Math.round((sym.bearish / total) * 100);
        return (
          <Group key={sym.symbol} justify="space-between" className="rounded-lg border border-slate-800 px-3 py-2">
            <Group gap="sm">
              <Badge color="blue" variant="light">
                {sym.symbol}
              </Badge>
              <Text size="sm" c="gray.4">
                {sym.total} alerts
              </Text>
            </Group>
            <Group gap="xs">
              <Badge color="green" variant="outline">
                {bullishRatio}% Bullish
              </Badge>
              <Badge color="red" variant="outline">
                {bearishRatio}% Bearish
              </Badge>
            </Group>
          </Group>
        );
      })}
    </Stack>
  </Card>
);

function OverviewPage() {
  const [range, setRange] = useState('24h');
  const [assetType, setAssetType] = useState<string | null>('all');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topSymbols, setTopSymbols] = useState<TopSymbolStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = calcFrom(range);
        const overview = await apiClient.fetchOverview({ from });
        const symbols = await apiClient.fetchTopSymbols({ from, limit: 8 });
        setStats(overview);
        setTopSymbols(symbols.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load overview (stub data is available once backend is reachable).');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const chartData = useMemo(
    () =>
      stats?.bullishBearishTimeline?.map((p) => ({
        name: p.bucket,
        bullish: p.bullish,
        bearish: p.bearish,
      })) ?? [],
    [stats]
  );

  const totalAlerts = stats?.totalAlerts ?? 0;
  const majorBullishPct = totalAlerts ? Math.round(((stats?.majorBullish ?? 0) / totalAlerts) * 100) : 0;
  const majorBearishPct = totalAlerts ? Math.round(((stats?.majorBearish ?? 0) / totalAlerts) * 100) : 0;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>Global Overview</Title>
          <Text c="gray.4">Sentiment tape with veracity guardrails for the last window.</Text>
        </div>
        <Group gap="sm">
          <SegmentedControl
            value={range}
            onChange={setRange}
            data={[{ label: '24h', value: '24h' }, { label: '72h', value: '72h' }, { label: '7d', value: '7d' }]}
          />
          <Select
            data={[
              { label: 'All assets', value: 'all' },
              { label: 'Stocks', value: 'stock' },
              { label: 'Crypto', value: 'crypto' },
            ]}
            value={assetType}
            onChange={setAssetType}
            description="Asset filter is UI-only until asset_type lands in the API."
            placeholder="Asset type"
          />
        </Group>
      </Group>

      {loading && (
        <Group justify="center">
          <Loader color="cyan" />
        </Group>
      )}
      {error && (
        <Paper p="sm" radius="md" className="bg-amber-500/10 border border-amber-500/30">
          <Text c="orange.2" size="sm">
            {error}
          </Text>
        </Paper>
      )}

      <div className="card-grid">
        <MetricCard label="Total alerts" value={stats?.totalAlerts ?? '—'} icon={<IconActivity size={20} />} />
        <MetricCard
          label="Major bullish"
          value={stats?.majorBullish ?? '—'}
          icon={<IconMoodSmile size={20} color="#22c55e" />}
          description={`${majorBullishPct}% of tape`}
        />
        <MetricCard
          label="Major bearish"
          value={stats?.majorBearish ?? '—'}
          icon={<IconMoodSad size={20} color="#ef4444" />}
          description={`${majorBearishPct}% of tape`}
          accent="red"
        />
        <MetricCard
          label="Rumor vs official"
          value={ratioText(stats?.rumorCount ?? 0, stats?.officialCount ?? 0)}
          description={`${stats?.officialCount ?? 0} official / ${stats?.multiSourceCount ?? 0} multi-source`}
          icon={<IconShieldCheck size={20} color="#facc15" />}
          accent="yellow"
        />
      </div>

      <Group align="flex-start" grow>
        <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ flex: 2 }}>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Bullish vs Bearish — timeline</Title>
            <Badge color="gray" variant="outline">
              Aggregated hourly (stubbed via backend aggregation helper)
            </Badge>
          </Group>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Legend />
                <Area type="monotone" dataKey="bullish" stroke="#22c55e" fill="#16a34a55" />
                <Area type="monotone" dataKey="bearish" stroke="#ef4444" fill="#ef444455" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <TopSymbols data={topSymbols} />
      </Group>
    </Stack>
  );
}

export default OverviewPage;
