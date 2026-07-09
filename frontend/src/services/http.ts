/**
 * Cliente HTTP para la implementación `api` (Fase 3).
 *  - adjunta Authorization Bearer del access token
 *  - guarda tokens en localStorage
 *  - auto-refresh en 401 (rota y reintenta la petición una vez)
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

const AT_KEY = 'fortiva_at';
const RT_KEY = 'fortiva_rt';

let accessToken: string | null = localStorage.getItem(AT_KEY);
let refreshToken: string | null = localStorage.getItem(RT_KEY);

export function setTokens(at: string | null, rt: string | null) {
  accessToken = at;
  refreshToken = rt;
  if (at) localStorage.setItem(AT_KEY, at);
  else localStorage.removeItem(AT_KEY);
  if (rt) localStorage.setItem(RT_KEY, rt);
  else localStorage.removeItem(RT_KEY);
}

export function clearTokens() {
  setTokens(null, null);
}

export function getAccessToken() {
  return accessToken;
}
export function getRefreshToken() {
  return refreshToken;
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const json = await res.json();
    const data = json.data ?? json;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function http<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return http<T>(path, init, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => ({}));
  return (json.data ?? json) as T; // el backend responde { data }
}

/**
 * Descarga un archivo desde un endpoint PROTEGIDO. No sirve un `<a href>` simple porque el
 * endpoint exige `Authorization: Bearer`. Hace fetch con el token, toma `response.blob()` y
 * dispara la descarga con un `<a download>` temporal. En 401 reintenta una vez tras refrescar.
 */
export async function downloadFile(path: string, filename: string, retry = true): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return downloadFile(path, filename, false);
  }
  if (!res.ok) {
    throw new Error(`No se pudo descargar el archivo (HTTP ${res.status}).`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
