const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {}
  // Only set Content-Type for JSON requests (not FormData)
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  })
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}

export function formatBRL(value: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export function formatDate(value: string): string {
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')
}
