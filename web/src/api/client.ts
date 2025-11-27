import { Alert, OverviewStats, SymbolSummary, TopSymbolStat } from '../types/api.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

type FetchOptions = {
  params?: Record<string, string | number | undefined | null>;
};

const buildUrl = (path: string, params?: FetchOptions['params']): string => {
  const base = API_BASE && API_BASE.startsWith('http') ? API_BASE : window.location.origin;
  const url = new URL(path, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const apiClient = {
  async fetchAlerts(params: Record<string, string | number | undefined>) {
    const url = buildUrl('/alerts', params);
    return handleResponse<{ data: Alert[] }>(await fetch(url));
  },
  async fetchOverview(params?: { from?: string; to?: string }) {
    const url = buildUrl('/stats/overview', params);
    return handleResponse<OverviewStats>(await fetch(url));
  },
  async fetchTopSymbols(params?: { from?: string; to?: string; limit?: number }) {
    const url = buildUrl('/stats/top-symbols', params);
    return handleResponse<{ data: TopSymbolStat[] }>(await fetch(url));
  },
  async fetchSymbolSummary(symbol: string, params?: { from?: string; to?: string }) {
    const url = buildUrl(`/symbols/${encodeURIComponent(symbol)}/summary`, params);
    return handleResponse<SymbolSummary>(await fetch(url));
  },
};
