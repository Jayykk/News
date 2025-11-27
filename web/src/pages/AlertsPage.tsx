import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAdjustments, IconClockHour4, IconSearch } from '@tabler/icons-react';
import { apiClient } from '../api/client.js';
import { Alert } from '../types/api.js';
import AlertList from '../components/AlertList.js';
import AlertDetailDrawer from '../components/AlertDetailDrawer.js';

const COMMON_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA', 'TSLA'];

const buildFrom = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [hours, setHours] = useState<number | ''>(24);
  const [symbol, setSymbol] = useState('');
  const [impactPolarity, setImpactPolarity] = useState<string | null>(null);
  const [impactMagnitude, setImpactMagnitude] = useState<string | null>(null);
  const [veracityLevel, setVeracityLevel] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const from = typeof hours === 'number' ? buildFrom(hours) : undefined;
        const response = await apiClient.fetchAlerts({ symbol: symbol || undefined, from });
        setAlerts(response.data);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };
    load();
  }, [symbol, hours]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (impactPolarity && a.analysis?.impactPolarity !== impactPolarity) return false;
      if (impactMagnitude && a.analysis?.impactMagnitude !== impactMagnitude) return false;
      if (veracityLevel.length && !veracityLevel.includes(a.analysis?.veracityLevel ?? '')) return false;
      return true;
    });
  }, [alerts, impactPolarity, impactMagnitude, veracityLevel]);

  return (
    <Group align="flex-start" gap="md" grow>
      <Card withBorder radius="lg" className="bg-slate-900/70 border border-slate-800" style={{ maxWidth: 320 }}>
        <Group gap="xs" mb="sm">
          <IconAdjustments size={18} />
          <Title order={5}>Filters</Title>
        </Group>
        <Stack gap="sm">
          <TextInput
            label="Symbol"
            placeholder="e.g. BTC"
            value={symbol}
            onChange={(event) => setSymbol(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Group gap="xs">
            {COMMON_SYMBOLS.map((sym) => (
              <Badge
                key={sym}
                variant={symbol === sym ? 'filled' : 'outline'}
                color="cyan"
                onClick={() => setSymbol(sym)}
                style={{ cursor: 'pointer' }}
              >
                {sym}
              </Badge>
            ))}
          </Group>
          <SegmentedControl
            value={impactPolarity ?? 'all'}
            onChange={(val) => setImpactPolarity(val === 'all' ? null : val)}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Bullish', value: 'bullish' },
              { label: 'Bearish', value: 'bearish' },
              { label: 'Neutral', value: 'neutral' },
            ]}
            fullWidth
          />
          <SegmentedControl
            value={impactMagnitude ?? 'all'}
            onChange={(val) => setImpactMagnitude(val === 'all' ? null : val)}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Major', value: 'major' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Minor', value: 'minor' },
            ]}
            fullWidth
          />
          <MultiSelect
            label="Veracity"
            data={[
              { label: 'Official', value: 'official' },
              { label: 'Multi-source', value: 'multi_source' },
              { label: 'Single source', value: 'single_source' },
              { label: 'Rumor', value: 'rumor' },
            ]}
            description="Client-side filtering until backend accepts these params."
            value={veracityLevel}
            onChange={setVeracityLevel}
            searchable
            clearable
          />
          <NumberInput
            label="Lookback (hours)"
            value={hours}
            onChange={setHours}
            min={1}
            max={168}
            step={6}
            leftSection={<IconClockHour4 size={16} />}
          />
          <Divider my="xs" />
          <Button variant="light" onClick={() => setSymbol('')} fullWidth>
            Reset symbol
          </Button>
        </Stack>
      </Card>

      <Stack gap="sm" style={{ flex: 1 }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={4}>Alerts stream</Title>
            <Text size="sm" c="gray.4">
              Impact & veracity annotated alerts; click to open the drill-down drawer.
            </Text>
          </div>
          <Badge color="cyan" variant="outline">
            {filteredAlerts.length} visible of {alerts.length}
          </Badge>
        </Group>
        <AlertList alerts={filteredAlerts} onSelect={setSelected} selectedId={selected?.id} />
      </Stack>

      <AlertDetailDrawer alert={selected} onClose={() => setSelected(null)} />
    </Group>
  );
}

export default AlertsPage;
