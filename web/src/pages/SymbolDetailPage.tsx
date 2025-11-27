import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
} from 'recharts';
import { apiClient } from '../api/client.js';
import { Alert, SymbolSummary } from '../types/api.js';
import AlertList from '../components/AlertList.js';

const POLARITY_COLORS: Record<string, string> = {
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#94a3b8',
};

const VeracityBreakdown = ({ summary }: { summary: SymbolSummary | null }) => {
  if (!summary) return null;
  const total =
    summary.veracityCounts.official +
    summary.veracityCounts.rumor +
    summary.veracityCounts.multiSource +
    summary.veracityCounts.singleSource;
  return (
    <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800">
      <Title order={5} mb="xs">
        Veracity mix
      </Title>
      <Stack gap="xs">
        {[
          ['Official', summary.veracityCounts.official],
          ['Multi-source', summary.veracityCounts.multiSource],
          ['Single source', summary.veracityCounts.singleSource],
          ['Rumor', summary.veracityCounts.rumor],
        ].map(([label, value]) => (
          <div key={label as string}>
            <Group justify="space-between">
              <Text size="sm" c="gray.4">
                {label}
              </Text>
              <Text size="sm" fw={600}>
                {value as number}
              </Text>
            </Group>
            <Progress value={total ? ((value as number) / total) * 100 : 0} color="cyan" size="sm" radius="xl" />
          </div>
        ))}
      </Stack>
    </Card>
  );
};

function SymbolDetailPage() {
  const { symbol = '' } = useParams();
  const [summary, setSummary] = useState<SymbolSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, alertData] = await Promise.all([
          apiClient.fetchSymbolSummary(symbol),
          apiClient.fetchAlerts({ symbol }),
        ]);
        setSummary(summaryData);
        setAlerts(alertData.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load symbol view; using placeholders.');
      } finally {
        setLoading(false);
      }
    };
    if (symbol) load();
  }, [symbol]);

  const timelineData = useMemo(
    () =>
      summary?.timeline?.map((t) => ({
        name: new Date(t.timestamp).toLocaleString(),
        impact: t.impactScore,
        color: POLARITY_COLORS[t.polarity ?? 'neutral'] ?? '#64748b',
      })) ?? [],
    [summary]
  );

  const distributionData = useMemo(
    () => [
      { name: 'Bullish', value: summary?.distribution.bullish ?? 0, color: '#22c55e' },
      { name: 'Bearish', value: summary?.distribution.bearish ?? 0, color: '#ef4444' },
      { name: 'Neutral', value: summary?.distribution.neutral ?? 0, color: '#94a3b8' },
    ],
    [summary]
  );

  const tiltColor = summary?.sentimentTilt === 'bullish' ? 'green' : summary?.sentimentTilt === 'bearish' ? 'red' : 'gray';

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Group gap="xs" align="center">
            <Title order={3}>{symbol}</Title>
            <Badge color="blue" variant="light">
              Symbol detail
            </Badge>
          </Group>
          <Text size="sm" c="gray.4">
            Major flows in the last 24h/7d with AI-driven polarity and veracity.
          </Text>
        </div>
        {summary && (
          <RingProgress
            sections={[{ value: 100, color: tiltColor }]}
            label={<Text size="sm">{summary.sentimentTilt.toUpperCase()}</Text>}
          />
        )}
      </Group>

      {loading && (
        <Center>
          <Loader color="cyan" />
        </Center>
      )}
      {error && (
        <Paper p="sm" radius="md" className="bg-amber-500/10 border border-amber-500/30">
          <Text c="orange.2" size="sm">
            {error}
          </Text>
        </Paper>
      )}

      <Group grow align="stretch">
        <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ flex: 2 }}>
          <Group justify="space-between">
            <Title order={5}>Timeline</Title>
            <Badge color="gray" variant="outline">
              impact_score over time
            </Badge>
          </Group>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} hide />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 'auto']} />
                <RechartTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="impact" stroke="#22d3ee" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ flex: 1 }}>
          <Title order={5}>Polarity mix</Title>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <VeracityBreakdown summary={summary} />
      </Group>

      <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800">
        <Group justify="space-between" mb="sm">
          <Title order={5}>Alerts for {symbol}</Title>
          <Badge color="cyan" variant="light">
            {alerts.length} items
          </Badge>
        </Group>
        <AlertList alerts={alerts} onSelect={() => {}} />
        <Text size="xs" c="gray.5" mt="xs">
          Alert filters are computed server-side for symbol, other facets are client-side until dedicated endpoints arrive.
        </Text>
      </Card>
    </Stack>
  );
}

export default SymbolDetailPage;
