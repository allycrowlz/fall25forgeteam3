/**
 * Centralized authentication service for token management
 */

const TOKEN_KEY = 'access_token';
// Automatically detect backend URL based on current hostname
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Use the same hostname as the frontend, but port 8000
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return 'http://localhost:8000';
};
const API_BASE_URL = getApiBaseUrl();

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
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * Get the stored access token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the access token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the access token (logout)
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Get the Authorization header value
 */
export function getAuthHeader(): string | null {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}

/**
 * Check if token is expired (basic check - just checks if token exists)
 * For a more robust check, decode the JWT and check exp claim
 */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;

  try {
    // Decode JWT without verification (just to check expiration)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // If we can't decode, consider it expired
  }
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Login failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Register new user
 */
export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.detail || errorData.message || 'Registration failed';
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('No token to refresh');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If refresh fails, clear token and throw error
    removeToken();
    const errorText = await response.text();
    let errorMessage = 'Token refresh failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const token = getToken();
  
  // Try to call logout endpoint (don't fail if it errors)
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore errors - still clear local token
    }
  }

  // Always clear local token
  removeToken();
}

/**
 * Make an authenticated fetch request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getToken();

  // Check if token is expired and refresh if needed
  if (token && isTokenExpired()) {
    try {
      const refreshed = await refreshToken();
      token = refreshed.access_token;
      setToken(token);
    } catch (error) {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  // Add Authorization header
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401, try to refresh token once
  if (response.status === 401 && token) {
    try {
      const refreshed = await refreshToken();
      token = refreshed.access_token;
      setToken(token);

      // Retry the original request
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(url, {
        ...options,
        headers,
      });
    } catch {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

