import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Badge, Card, Group, Loader, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { apiClient } from '../api/client.js';
import { Alert } from '../types/api.js';

const buildFromRange = (range: string) => {
  const now = Date.now();
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    case '72h':
      return new Date(now - 72 * 3600 * 1000).toISOString();
    default:
      return new Date(now - 24 * 3600 * 1000).toISOString();
  }
};

function TrendsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [range, setRange] = useState('72h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const from = buildFromRange(range);
        const res = await apiClient.fetchAlerts({ from, limit: 300 });
        setAlerts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const eventDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => {
      const eventType = a.analysis?.eventType ?? 'other';
      counts[eventType] = (counts[eventType] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const netSentimentSeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    alerts.forEach((a) => {
      const ts = new Date(a.createdAt);
      const bucket = `${ts.toISOString().slice(0, 13)}:00`;
      const polarity = a.analysis?.impactPolarity;
      const delta = polarity === 'bullish' ? 1 : polarity === 'bearish' ? -1 : 0;
      buckets[bucket] = (buckets[bucket] ?? 0) + delta;
    });
    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [alerts]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>Trends & Insights</Title>
          <Text c="gray.4">Event-type mix and net sentiment pulse.</Text>
        </div>
        <SegmentedControl
          value={range}
          onChange={setRange}
          data={[{ label: '24h', value: '24h' }, { label: '72h', value: '72h' }, { label: '7d', value: '7d' }]}
        />
      </Group>

      {loading && (
        <Group justify="center">
          <Loader color="cyan" />
        </Group>
      )}

      <Group grow align="stretch">
        <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ flex: 1 }}>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Event types</Title>
            <Badge color="gray" variant="light">
              Using news_analysis.eventType
            </Badge>
          </Group>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <RechartTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ flex: 1 }}>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Net sentiment over time</Title>
            <Badge color="cyan" variant="outline">
              +1 bullish, -1 bearish
            </Badge>
          </Group>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netSentimentSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                <RechartTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Legend />
                <Line dataKey="value" stroke="#38bdf8" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Group>
    </Stack>
  );
}

export default TrendsPage;
