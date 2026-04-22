function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return `http://${window.location.hostname}:5001/api`;
  return 'http://localhost:5001/api';
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
  const res = await fetch(`${getApiBase()}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

async function authFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
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
      fetcher<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),
    me: () => authFetcher('/auth/me'),
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

  dashboard: {
    getStats: () => authFetcher('/dashboard/stats'),
  },
};
