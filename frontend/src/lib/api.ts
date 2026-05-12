import { cache } from "react";
import { cookies } from "next/headers";
import { env } from "@/config/env";

const BASE_URL = env.backendApiUrl;

// Resolvida uma vez por request — evita múltiplos await cookies() na mesma renderização
const getCookieStore = cache(() => cookies());

interface RequestOptions {
  method?: string;
  data?: unknown;
  params?: Record<string, string | undefined>;
  allowRefresh?: boolean;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await getCookieStore();
  const access = cookieStore.get("access_token")?.value;
  const refresh = cookieStore.get("refresh_token")?.value;

  if (!access) return {};

  const cookie = [
    access ? `access_token=${access}` : "",
    refresh ? `refresh_token=${refresh}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  return {
    Authorization: `Bearer ${access}`,
    Cookie: cookie,
  };
}

// Cached por request — garante apenas uma chamada HTTP a /auth/refresh/
// mesmo quando múltiplos fetches paralelos recebem 401 no mesmo ciclo de render
const attemptRefresh = cache(async (): Promise<string | null> => {
  const cookieStore = await getCookieStore();
  const refresh = cookieStore.get("refresh_token")?.value;
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  return data?.access ?? null;
});

export async function apiRequest<T = unknown>(
  path: string,
  { method = "GET", data, params, allowRefresh = true }: RequestOptions = {}
): Promise<{ status: number; data: T }> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }

  const authHeaders = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });

  if (response.status !== 401 || !allowRefresh) {
    const responseData = await response.json().catch(() => null);
    return { status: response.status, data: responseData };
  }

  const newAccess = await attemptRefresh();
  if (!newAccess) {
    const responseData = await response.json().catch(() => null);
    return { status: response.status, data: responseData };
  }

  const retryResponse = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newAccess}`,
    },
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });

  const retryData = await retryResponse.json().catch(() => null);
  return { status: retryResponse.status, data: retryData };
}

// ─── Helpers por recurso ──────────────────────────────────

export const api = {
  auth: {
    login: (data: unknown) =>
      apiRequest("/auth/login/", { method: "POST", data, allowRefresh: false }),
    register: (data: unknown) =>
      apiRequest("/auth/register/", {
        method: "POST",
        data,
        allowRefresh: false,
      }),
    logout: (data: unknown) =>
      apiRequest("/auth/logout/", {
        method: "POST",
        data,
        allowRefresh: false,
      }),
    refresh: (data: unknown) =>
      apiRequest("/auth/refresh/", {
        method: "POST",
        data,
        allowRefresh: false,
      }),
  },
  profile: {
    // Deduplicado por request: ProtectedLayout e PerfilPage compartilham um único fetch
    get: cache(() => apiRequest("/profile/")),
    update: (data: unknown) => apiRequest("/profile/", { method: "PATCH", data }),
  },
  categories: {
    list: (params?: Record<string, string | undefined>) =>
      apiRequest("/categories/", { params }),
    create: (data: unknown) =>
      apiRequest("/categories/", { method: "POST", data }),
    retrieve: (id: number | string) => apiRequest(`/categories/${id}/`),
    update: (id: number | string, data: unknown) =>
      apiRequest(`/categories/${id}/`, { method: "PATCH", data }),
    delete: (id: number | string) =>
      apiRequest(`/categories/${id}/`, { method: "DELETE" }),
  },
  transactions: {
    list: (params?: Record<string, string | undefined>) =>
      apiRequest("/transactions/", { params }),
    create: (data: unknown) =>
      apiRequest("/transactions/", { method: "POST", data }),
    retrieve: (id: number | string) => apiRequest(`/transactions/${id}/`),
    update: (id: number | string, data: unknown) =>
      apiRequest(`/transactions/${id}/`, { method: "PATCH", data }),
    delete: (id: number | string) =>
      apiRequest(`/transactions/${id}/`, { method: "DELETE" }),
  },
  budgets: {
    list: (params?: Record<string, string | undefined>) =>
      apiRequest("/budgets/", { params }),
    create: (data: unknown) =>
      apiRequest("/budgets/", { method: "POST", data }),
    retrieve: (id: number | string) => apiRequest(`/budgets/${id}/`),
    finalize: (id: number | string) =>
      apiRequest(`/budgets/${id}/finalize/`, { method: "POST" }),
    delete: (id: number | string) =>
      apiRequest(`/budgets/${id}/`, { method: "DELETE" }),
  },
  dashboard: {
    get: (params?: Record<string, string | undefined>) =>
      apiRequest("/dashboard/", { params }),
    categorySeries: (params?: Record<string, string | undefined>) =>
      apiRequest("/dashboard/category-series/", { params }),
  },
  analytics: {
    get: (params?: Record<string, string | undefined>) =>
      apiRequest("/analytics/profile/", { params }),
  },
};
