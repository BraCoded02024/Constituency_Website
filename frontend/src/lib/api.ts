import { writeLocalStorage } from './useIsClient';

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // Same origin + /api. Local Next proxies to Express (see next.config.ts);
    // Vercel rewrites /api to the backend service.
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5001/api';
}

function unreachableApiError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error('Cannot reach the API. Make sure the backend is running on port 5001.');
  }
  return err instanceof Error ? err : new Error('Request failed');
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw unreachableApiError(err);
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

async function authFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${endpoint}`, {
      ...options,
      headers: { ...authHeaders(), ...(options?.headers || {}) },
    });
  } catch (err) {
    throw unreachableApiError(err);
  }
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      writeLocalStorage('admin_token', null);
      writeLocalStorage('admin_user', null);
      window.location.href = '/admin/login';
    }
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const res = await fetch(`${getApiBase()}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetcher<{ token: string; user: import('@/lib/permissions').AdminUser }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),
    me: () => authFetcher<import('@/lib/permissions').AdminUser>('/auth/me'),
    updateProfile: (data: Record<string, string>) =>
      authFetcher('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },

  upload: uploadFile,

  announcements: {
    getAll: () => fetcher('/announcements'),
    getById: (id: string) => fetcher(`/announcements/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/announcements/${id}`, { method: 'DELETE' }),
  },

  projects: {
    getAll: () => fetcher('/projects'),
    getById: (id: string) => fetcher(`/projects/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/projects/${id}`, { method: 'DELETE' }),
  },

  events: {
    getAll: () => fetcher('/events'),
    getById: (id: string) => fetcher(`/events/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/events/${id}`, { method: 'DELETE' }),
  },

  opportunities: {
    getAll: () => fetcher('/opportunities'),
    getById: (id: string) => fetcher(`/opportunities/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    apply: (id: string) => fetcher(`/opportunities/${id}/apply`, { method: 'POST' }),
    delete: (id: string) =>
      authFetcher(`/opportunities/${id}`, { method: 'DELETE' }),
  },

  gallery: {
    getAll: () => fetcher('/gallery'),
    getStories: () => fetcher('/gallery/stories'),
    create: (data: Record<string, unknown>) =>
      authFetcher('/gallery', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/gallery/${id}`, { method: 'DELETE' }),
  },

  services: {
    getAll: () => fetcher('/services'),
    create: (data: Record<string, unknown>) =>
      authFetcher('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/services/${id}`, { method: 'DELETE' }),
  },

  successStories: {
    getAll: () => fetcher('/success-stories'),
    create: (data: Record<string, unknown>) =>
      authFetcher('/success-stories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/success-stories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/success-stories/${id}`, { method: 'DELETE' }),
  },

  constituents: {
    getAll: () => authFetcher('/constituents'),
    getStats: () => fetcher('/constituents/stats'),
    register: (data: Record<string, string>) =>
      fetcher('/constituents', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/constituents/${id}`, { method: 'DELETE' }),
  },

  concerns: {
    getAll: () => fetcher('/concerns'),
    getById: (id: string) => fetcher(`/concerns/${id}`),
    submit: (data: Record<string, string>) =>
      fetcher('/concerns', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: { status: string; priority?: string }) =>
      authFetcher(`/concerns/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    respond: (id: string, data: { message: string; status?: string }) =>
      authFetcher(`/concerns/${id}/respond`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/concerns/${id}`, { method: 'DELETE' }),
  },

  volunteers: {
    getAll: () => fetcher('/volunteers'),
    register: (data: Record<string, string>) =>
      fetcher('/volunteers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/volunteers/${id}`, { method: 'DELETE' }),
  },

  delegates: {
    getAll: (params?: {
      search?: string;
      electoralAreaId?: string;
      pollingStationId?: string;
      categoryId?: string;
      status?: string;
      gender?: string;
      currentStatus?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.electoralAreaId) q.set('electoralAreaId', params.electoralAreaId);
      if (params?.pollingStationId) q.set('pollingStationId', params.pollingStationId);
      if (params?.categoryId) q.set('categoryId', params.categoryId);
      if (params?.status) q.set('status', params.status);
      if (params?.gender) q.set('gender', params.gender);
      if (params?.currentStatus) q.set('currentStatus', params.currentStatus);
      if (params?.sort) q.set('sort', params.sort);
      if (params?.page != null) q.set('page', String(params.page));
      if (params?.limit != null) q.set('limit', String(params.limit));
      const qs = q.toString();
      return authFetcher(`/delegates${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => authFetcher(`/delegates/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/delegates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/delegates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      authFetcher(`/delegates/${id}`, { method: 'DELETE' }),
    getSurveys: (id: string) => authFetcher(`/delegates/${id}/surveys`),
    recordSurvey: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/delegates/${id}/surveys`, { method: 'POST', body: JSON.stringify(data) }),
    import: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const res = await fetch(`${getApiBase()}/delegates/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          writeLocalStorage('admin_token', null);
          writeLocalStorage('admin_user', null);
          window.location.href = '/admin/login';
        }
        throw new Error('Session expired');
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(error.error || 'Import failed');
      }
      return res.json() as Promise<{
        imported: number;
        skipped: number;
        total: number;
        failed?: { row: number; field: string; reason: string }[];
      }>;
    },
  },

  electoralAreas: {
    getAll: (params?: { active?: boolean }) =>
      authFetcher(`/electoral-areas${params?.active ? '?active=true' : ''}`),
    getById: (id: string) => authFetcher(`/electoral-areas/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/electoral-areas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/electoral-areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  pollingStations: {
    getAll: (params?: { electoralAreaId?: string; active?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.electoralAreaId) q.set('electoralAreaId', params.electoralAreaId);
      if (params?.active) q.set('active', 'true');
      const qs = q.toString();
      return authFetcher(`/polling-stations${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => authFetcher(`/polling-stations/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/polling-stations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/polling-stations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  delegateCategories: {
    getAll: (params?: { active?: boolean }) =>
      authFetcher(`/delegate-categories${params?.active ? '?active=true' : ''}`),
    getById: (id: string) => authFetcher(`/delegate-categories/${id}`),
    create: (data: Record<string, unknown>) =>
      authFetcher('/delegate-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/delegate-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  delegateReports: {
    get: (params?: Record<string, string | undefined>) => {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v) q.set(k, v);
        }
      }
      const qs = q.toString();
      return authFetcher(`/delegate-reports${qs ? `?${qs}` : ''}`);
    },
    exportCsvUrl: (params?: Record<string, string | undefined>) => {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v) q.set(k, v);
        }
      }
      const qs = q.toString();
      return `${getApiBase()}/delegate-reports/export.csv${qs ? `?${qs}` : ''}`;
    },
  },

  delegateDashboard: {
    getFollowUps: (limit = 100) => authFetcher(`/delegate-dashboard/follow-ups?limit=${limit}`),
    getStats: (params?: { electoralAreaId?: string }) => {
      const q = new URLSearchParams();
      if (params?.electoralAreaId) q.set('electoralAreaId', params.electoralAreaId);
      const qs = q.toString();
      return authFetcher(`/delegate-dashboard/stats${qs ? `?${qs}` : ''}`);
    },
  },

  sms: {
    status: () => authFetcher<{ configured: boolean }>('/sms/status'),
    list: (delegateId?: string) =>
      authFetcher(`/sms${delegateId ? `?delegateId=${encodeURIComponent(delegateId)}` : ''}`),
    audience: (params?: Record<string, string | number | undefined>) => {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v != null && v !== '') q.set(k, String(v));
        }
      }
      const qs = q.toString();
      return authFetcher(`/sms/audience${qs ? `?${qs}` : ''}`);
    },
    send: (data: { delegateIds: string[]; message: string }) =>
      authFetcher<{
        sent: unknown[];
        rejected: { delegateId: string; name?: string; reason: string }[];
        sentCount: number;
        failedCount: number;
      }>('/sms/send', { method: 'POST', body: JSON.stringify(data) }),
  },

  activity: {
    getAll: (params?: { entity?: string; entityId?: string; action?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.entity) q.set('entity', params.entity);
      if (params?.entityId) q.set('entityId', params.entityId);
      if (params?.action) q.set('action', params.action);
      if (params?.limit != null) q.set('limit', String(params.limit));
      if (params?.offset != null) q.set('offset', String(params.offset));
      const qs = q.toString();
      return authFetcher(`/activity${qs ? `?${qs}` : ''}`);
    },
  },

  dashboard: {
    getStats: () => authFetcher('/dashboard/stats'),
  },

  staff: {
    getAll: () => authFetcher<import('@/lib/permissions').AdminUser[]>('/staff'),
    getMeta: () => authFetcher<{ privileges: string[]; labels: Record<string, string> }>('/staff/meta'),
    create: (data: Record<string, unknown>) =>
      authFetcher('/staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      authFetcher(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deactivate: (id: string) =>
      authFetcher(`/staff/${id}`, { method: 'DELETE' }),
  },
};
