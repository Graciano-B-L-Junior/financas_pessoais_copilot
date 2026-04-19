import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

/**
 * Decodifica o payload do JWT e verifica se o token ainda não expirou.
 * Não valida assinatura — apenas lê o campo `exp` para evitar redirecionar
 * com tokens expirados que ainda estão presentes nos cookies.
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    // Base64url → Base64 → JSON
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )
    const now = Math.floor(Date.now() / 1000)
    return typeof payload.exp === 'number' && payload.exp > now
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas internas da API Next.js (ex: /api/logout) sem verificação
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const accessToken = request.cookies.get('access')?.value ?? ''
  const isAuthenticated = isTokenValid(accessToken)

  if (!isPublic && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
