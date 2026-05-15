import { useAuthStore } from '@/store/auth-store';
import { getMockResponse } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

async function refreshAccessToken(): Promise<string | null> {
  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      store.logout();
      return null;
    }

    const json = await res.json();
    const newToken = json.data?.accessToken ?? json.accessToken;
    store.setAuth({
      user: store.user!,
      accessToken: newToken,
      refreshToken: store.refreshToken!,
    });
    return newToken;
  } catch {
    store.logout();
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Demo mode: return mock data without hitting the backend
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 320)); // simulate latency
    const mock = getMockResponse(path);
    if (mock !== null) return mock as T;
  }

  const store = useAuthStore.getState();
  let token = store.accessToken;

  const makeRequest = async (t: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (t) headers['Authorization'] = `Bearer ${t}`;

    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let res = await makeRequest(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error('Unauthorized');
    res = await makeRequest(newToken);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}
