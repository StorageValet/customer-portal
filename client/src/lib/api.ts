export const API_BASE = import.meta.env.VITE_API_BASE || '/api';
async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!res.ok) { const err = isJson ? await res.json().catch(() => ({})) : { error: 'http_error' }; throw Object.assign(new Error(err.error || 'http_error'), { status: res.status, data: err }); }
  return isJson ? res.json() : res.text();
}
export const api = { me: () => req('/auth/me'), signup: (body: any) => req('/auth/signup', { method: 'POST', body: JSON.stringify(body) }), magicLinkRequest: (email: string) => req('/auth/magic-link/request', { method: 'POST', body: JSON.stringify({ email }) }), magicLinkVerify: (token: string) => req('/auth/magic-link/verify', { method: 'POST', body: JSON.stringify({ token }) }), items: () => req('/items') };
