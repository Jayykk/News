import { Badge, Group, Paper, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  accent?: string;
  icon?: ReactNode;
}

export const MetricCard = ({ label, value, description, accent = 'cyan', icon }: MetricCardProps) => (
  <Paper shadow="sm" radius="lg" p="md" className="bg-slate-900/70 border border-slate-800">
    <Group justify="space-between" mb={4}>
      <Text size="sm" c="gray.4" fw={600}>
        {label}
      </Text>
      {icon}
    </Group>
    <Text fz={28} fw={700} c={`${accent}.3`}>
      {value}
    </Text>
    {description && (
      <Badge color={accent} variant="light" mt="sm">
        {description}
      </Badge>
    )}
  </Paper>
);
