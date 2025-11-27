import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Burger,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconBellRinging, IconChartLine, IconLayoutDashboard, IconRadar, IconTrendingUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage.js';
import AlertsPage from './pages/AlertsPage.js';
import SymbolDetailPage from './pages/SymbolDetailPage.js';
import TrendsPage from './pages/TrendsPage.js';

const navLinks = [
  { to: '/overview', label: 'Global Overview', icon: <IconLayoutDashboard size={18} /> },
  { to: '/alerts', label: 'Alerts Stream', icon: <IconBellRinging size={18} /> },
  { to: '/trends', label: 'Trends & Insights', icon: <IconRadar size={18} /> },
];

const Navigation = () => {
  const location = useLocation();
  return (
    <Stack gap="xs">
      {navLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className="no-underline">
          {({ isActive }) => (
            <Group
              px="md"
              py={10}
              gap="sm"
              className={`rounded-lg border border-slate-800 transition-colors ${
                isActive ? 'bg-slate-800/60 text-white' : 'hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              {link.icon}
              <Text fw={600} size="sm">
                {link.label}
              </Text>
              {location.pathname.startsWith(link.to) && <Badge color="cyan">Live</Badge>}
            </Group>
          )}
        </NavLink>
      ))}
    </Stack>
  );
};

function App() {
  const [mobileOpened, { toggle }] = useDisclosure(false);

  return (
    <AppShell
      padding="md"
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }}
      header={{ height: 64 }}
      styles={{
        main: { background: 'transparent' },
        navbar: { backgroundColor: 'rgba(15, 23, 42, 0.9)' },
        header: { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(148,163,184,0.2)' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={mobileOpened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <IconChartLine color="#22d3ee" />
              <Title order={4} c="cyan.3">
                Trader Ops Room
              </Title>
              <Badge color="grape" leftSection={<IconTrendingUp size={14} />}>
                Phase 1
              </Badge>
            </Group>
            <Badge color="cyan" variant="light">
              Live sentiment & verification heatmap
            </Badge>
          </Group>
          <Group gap="xs">
            <Tooltip label="Market pulse">
              <ActionIcon variant="subtle" color="green" size="lg">
                <IconBellRinging size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section component={ScrollArea} grow>
          <Navigation />
          <Box mt="lg" p="md" className="rounded-xl bg-slate-900 border border-slate-800">
            <Text size="sm" c="gray.4">
              View per-symbol battle cards:
            </Text>
            <Group gap="xs" mt="xs">
              {['AAPL', 'TSLA', 'NVDA', 'BTC', 'ETH'].map((sym) => (
                <NavLink key={sym} to={`/symbol/${sym}`} className="no-underline">
                  <Badge variant="dot" color="blue" radius="sm">
                    {sym}
                  </Badge>
                </NavLink>
              ))}
            </Group>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box className="dashboard-bg min-h-screen p-2 sm:p-4 rounded-xl">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/symbol/:symbol" element={<SymbolDetailPage />} />
            <Route path="/trends" element={<TrendsPage />} />
          </Routes>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
