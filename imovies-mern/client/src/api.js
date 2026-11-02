// tiny fetch wrapper: adds the JWT, parses JSON and throws readable errors
const BASE = import.meta.env.VITE_API_URL || '/api';
export const getToken = () => localStorage.getItem('im_token');

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
