const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_STORAGE_KEY = 'fixmate_jwt_token';
const USER_STORAGE_KEY = 'fixmate_user_cache';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
  errors?: Array<{ field: string; message: string }>;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<ApiResponse<T>> {
  const { token, headers, ...rest } = options;
  const activeToken = token !== undefined ? token : getStoredToken();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (activeToken) {
    reqHeaders['Authorization'] = `Bearer ${activeToken}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!response.ok || !payload.success) {
    const err = new Error(
      payload.message || `Request failed (${response.status})`
    ) as Error & { statusCode?: number; errors?: unknown };
    err.statusCode = response.status;
    err.errors = payload.errors;
    throw err;
  }

  return payload;
}
