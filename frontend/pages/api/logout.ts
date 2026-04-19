import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * POST /api/logout
 *
 * Rota Next.js que limpa os cookies de autenticação (`access` e `refresh`)
 * diretamente no browser, mesmo que o backend Django esteja inacessível.
 *
 * Após limpar os cookies, dispara um pedido de blacklist ao backend (fire-and-forget).
 * O usuário é deslogado imediatamente, independente da resposta do backend.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  // Limpa cookies no browser com Max-Age=0 (funciona mesmo com HttpOnly,
  // pois a rota Next.js roda no servidor e pode sobrescrever o cookie)
  res.setHeader('Set-Cookie', [
    'access=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
    'refresh=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
  ])

  // Tenta invalidar o refresh token no backend (best-effort, não bloqueia)
  const refreshToken = req.cookies['refresh']
  if (refreshToken) {
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      await fetch(`${backendUrl}/api/v1/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `refresh=${refreshToken}` },
      })
    } catch {
      // Backend inacessível — cookies já foram limpos acima, sem problema
    }
  }

  return res.status(200).json({ detail: 'logout efetuado' })
}
