import { Anchor, Badge, Drawer, Group, List, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink, IconInfoCircle } from '@tabler/icons-react';
import { Alert } from '../types/api.js';

interface AlertDetailDrawerProps {
  alert: Alert | null;
  onClose: () => void;
}

const formatDate = (date: string | undefined) => (date ? new Date(date).toLocaleString() : 'Unknown');

export const AlertDetailDrawer = ({ alert, onClose }: AlertDetailDrawerProps) => (
  <Drawer
    opened={!!alert}
    onClose={onClose}
    title={<Title order={4}>Alert detail</Title>}
    position="right"
    size={460}
    overlayProps={{ opacity: 0.45, blur: 4 }}
  >
    {!alert ? (
      <Text c="gray.5">Select an alert to view details.</Text>
    ) : (
      <Stack gap="md">
        <Group justify="space-between">
          <Badge color={alert.analysis?.impactPolarity === 'bullish' ? 'green' : alert.analysis?.impactPolarity === 'bearish' ? 'red' : 'gray'}>
            {alert.analysis?.impactPolarity ?? 'Unlabeled'}
          </Badge>
          <Badge color={alert.analysis?.impactMagnitude === 'major' ? 'grape' : 'blue'} variant="light">
            {alert.analysis?.impactMagnitude ?? 'magnitude?'}
          </Badge>
        </Group>

        <div>
          <Text fw={700}>{alert.summary}</Text>
          <Text size="sm" c="gray.5">
            {alert.rawNews?.title}
          </Text>
          <Text size="xs" c="gray.6" mt={4}>
            {alert.rawNews?.source} · {formatDate(alert.rawNews?.publishedAt ?? alert.createdAt)}
          </Text>
          {alert.rawNews?.url && (
            <Anchor href={alert.rawNews.url} target="_blank" rel="noreferrer" c="cyan.4">
              Open source <IconExternalLink size={14} style={{ display: 'inline', marginLeft: 4 }} />
            </Anchor>
          )}
        </div>

        <Stack gap={6}>
          <Text size="sm" fw={600} c="gray.3">
            Predicted move
          </Text>
          <Group gap="xs">
            <Badge color="cyan" variant="light">
              Direction: {alert.analysis?.predictedDirection ?? 'uncertain'}
            </Badge>
            <Badge color="indigo" variant="light">
              Horizon: {alert.analysis?.predictedHorizon ?? 'n/a'}
            </Badge>
            {alert.analysis?.predictedAbsMove1h !== undefined && alert.analysis?.predictedAbsMove1h !== null && (
              <Badge color="teal" variant="light">
                |Δ| 1h: {alert.analysis.predictedAbsMove1h.toFixed(3)}
              </Badge>
            )}
          </Group>
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={600} c="gray.3">
            Veracity & signal
          </Text>
          <Group gap="xs">
            <Badge leftSection={<IconInfoCircle size={14} />} color="yellow" variant="light">
              {alert.analysis?.veracityLevel ?? 'unknown'} ({Math.round((alert.analysis?.veracityConfidence ?? 0) * 100)}%)
            </Badge>
            <Badge color="blue" variant="outline">
              Impact score: {alert.impactScore.toFixed(2)}
            </Badge>
            <Badge color="gray" variant="outline">
              Severity: {alert.severity}
            </Badge>
          </Group>
        </Stack>

        <div>
          <Text size="sm" fw={600} c="gray.3" mb={4}>
            Key reasons
          </Text>
          {alert.analysis?.keyReasons?.length ? (
            <List c="gray.4" spacing="xs">
              {alert.analysis.keyReasons.map((reason) => (
                <List.Item key={reason}>{reason}</List.Item>
              ))}
            </List>
          ) : (
            <Text size="sm" c="gray.6">
              No reasons provided (stub data).
            </Text>
          )}
        </div>

        <div>
          <Text size="sm" fw={600} c="gray.3" mb={4}>
            Full content
          </Text>
          <Text size="sm" className="bg-slate-900/60 p-3 rounded-lg border border-slate-800" c="gray.4">
            {alert.rawNews?.content?.slice(0, 1200) ?? 'No content available.'}
          </Text>
        </div>
      </Stack>
    )}
  </Drawer>
);

export default AlertDetailDrawer;
