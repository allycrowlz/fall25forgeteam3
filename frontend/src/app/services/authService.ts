/**
 * Centralized authentication service for token management
 * Uses same-origin /api/... URLs that are proxied by next.config.js rewrites
 */

const TOKEN_KEY = 'access_token';

// Build same-origin URLs (rewritten to the backend by Next)
const api = (p: string) => `/api${p}`;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  profile_name: string;
  email: string;
  password: string;
  picture?: string | null;
  birthday?: string | null;
  phone?: string | null; // optional; your form collects it
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id?: string;
  profile_id?: string;
  email: string;
  profile_name: string;
  picture?: string | null;
  birthday?: string | null; // ISO date
  phone?: string | null;
  role?: string | null;
  groups?: string[];
  created_at?: string; // ISO
}

/* ---------------- Token helpers ---------------- */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function getAuthHeader(): string | null {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}

/** Basic exp check for JWTs */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

/* ---------------- Auth endpoints ---------------- */
export async function login(credentials: { email: string; password: string }) {
  const res = await fetch(api('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error(await res.text() || 'Login failed');
  return res.json();
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(api('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error(await extractErr(response, 'Registration failed'));
  return response.json();
}

export async function refreshToken(): Promise<AuthResponse> {
  const token = getToken();
  if (!token) throw new Error('No token to refresh');

  const response = await fetch(api('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    removeToken();
    throw new Error(await extractErr(response, 'Token refresh failed'));
  }
  return response.json();
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(api('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ignore
    }
  }
  removeToken();
}

/* -------- Auto-refreshing authenticated fetch -------- */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getToken();

  // Refresh if expired
  if (token && isTokenExpired()) {
    try {
      const refreshed = await refreshToken();
      token = refreshed.access_token;
      setToken(token);
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && token) {
    // Try one refresh then retry
    try {
      const refreshed = await refreshToken();
      token = refreshed.access_token;
      setToken(token);
      headers.set('Authorization', `Bearer ${token}`);
      res = await fetch(url, { ...options, headers });
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return res;
}

/* ---------------- Current user ---------------- */
export async function getCurrentUser(): Promise<User> {
  const res = await authenticatedFetch(api('/auth/me'), { method: 'GET' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to load user');
  }
  return res.json();
}

/* ---------------- helpers ---------------- */
async function extractErr(res: Response, fallback: string) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.detail || json.message || fallback;
    } catch {
      return text || fallback;
    }
  } catch {
    return fallback;
  }
}

/* edit profile */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  const res = await authenticatedFetch(api('/auth/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update profile');
  }
  return res.json();
}