import { Badge, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@tabler/icons-react';
import { Alert } from '../types/api.js';

interface AlertListProps {
  alerts: Alert[];
  onSelect?: (alert: Alert) => void;
  selectedId?: string;
}

const polarityColor = (polarity?: string | null) => {
  if (polarity === 'bullish') return 'green';
  if (polarity === 'bearish') return 'red';
  return 'gray';
};

const directionIcon = (dir?: string | null) => {
  if (dir === 'up') return <IconArrowUpRight size={16} color="#22c55e" />;
  if (dir === 'down') return <IconArrowDownRight size={16} color="#ef4444" />;
  return <IconMinus size={14} color="#94a3b8" />;
};

export const AlertList = ({ alerts, onSelect, selectedId }: AlertListProps) => (
  <Stack gap="xs" className="scroll-area max-h-[calc(100vh-200px)] pr-1">
    {alerts.map((alert) => (
      <Card
        key={alert.id}
        shadow="sm"
        radius="md"
        withBorder
        className={`bg-slate-900/70 border transition-colors ${
          selectedId === alert.id ? 'border-cyan-400/80' : 'border-slate-800 hover:border-cyan-500/40'
        }`}
        onClick={() => onSelect?.(alert)}
      >
        <Group justify="space-between" mb={6}>
          <Group gap="xs">
            <Badge color={polarityColor(alert.analysis?.impactPolarity)} variant="filled">
              {alert.analysis?.impactPolarity ?? 'neutral'}
            </Badge>
            <Badge color={alert.analysis?.impactMagnitude === 'major' ? 'grape' : 'blue'} variant="light">
              {alert.analysis?.impactMagnitude ?? 'minor'}
            </Badge>
            {alert.analysis?.veracityLevel && (
              <Badge variant="outline" color="yellow">
                {alert.analysis.veracityLevel}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="gray.6">
            {new Date(alert.createdAt).toLocaleTimeString()}
          </Text>
        </Group>

        <Group gap="xs" align="center">
          {directionIcon(alert.analysis?.predictedDirection)}
          <Text fw={600} size="sm">
            {alert.rawNews?.symbolsRaw?.join(', ') || 'N/A'} · {alert.rawNews?.source ?? 'unknown'}
          </Text>
          <Tooltip label="Impact score is computed by SignalService weights">
            <Badge color="cyan" variant="outline">
              {alert.impactScore.toFixed(2)}
            </Badge>
          </Tooltip>
        </Group>

        <Text mt={6} size="sm" c="gray.3">
          {alert.summary || alert.rawNews?.title}
        </Text>
      </Card>
    ))}
  </Stack>
);

export default AlertList;
