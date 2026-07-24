const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const TENANT_SLUG = 'ayrton-estilistas';

function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customerAccessToken');
}

export function setCustomerToken(token: string) {
  localStorage.setItem('customerAccessToken', token);
}

export function clearCustomerToken() {
  localStorage.removeItem('customerAccessToken');
}

export function hasCustomerSession(): boolean {
  return !!getCustomerToken();
}

async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getCustomerToken();
  const response = await fetch(`${API_URL}/public/${TENANT_SLUG}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(typeof body.message === 'string' ? body.message : 'Error de red');
  }
  return response.json() as Promise<T>;
}

export const publicApi = {
  getServices: () => publicRequest<{ id: string; name: string; description: string | null; durationMin: number; priceCents: number }[]>('/services'),
  getGallery: () => publicRequest<{ id: string; url: string; caption: string | null }[]>('/gallery'),
  getAvailability: (serviceId: string, date: string, employeeId?: string) =>
    publicRequest<{ employeeId: string; employeeName: string; slots: string[] }[]>(
      `/availability?${new URLSearchParams({ serviceId, date, ...(employeeId ? { employeeId } : {}) })}`
    ),
  book: (data: { serviceId: string; employeeId: string; startsAt: string; customerFullName: string; customerPhone: string }) =>
    publicRequest('/book', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { fullName: string; phone: string; email?: string; password: string }) =>
    publicRequest<{ accessToken: string }>('/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { identifier: string; password: string }) =>
    publicRequest<{ accessToken: string }>('/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => publicRequest<{ fullName: string; totalVisits: number; loyalty: { tier: string; discountPercent: number; nextTier: { tier: string; visitsNeeded: number } | null } }>('/me'),
};

/** Intenta loguear como staff (dueño/peluquero); si falla, intenta como cliente. Usado en el login unificado de la web pública. */
export async function unifiedLogin(email: string, password: string): Promise<{ kind: 'staff' } | { kind: 'customer' }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return { kind: 'staff' };
    }
  } catch {
    // sigue con el intento de cliente
  }

  const customerRes = await publicApi.login({ identifier: email, password });
  setCustomerToken(customerRes.accessToken);
  return { kind: 'customer' };
}
