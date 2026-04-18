const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
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
