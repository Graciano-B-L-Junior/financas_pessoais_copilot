import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

const MENU_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '📊' },
  { href: '/transactions', label: 'Lançamentos',  icon: '💰' },
  { href: '/categories',   label: 'Categorias',   icon: '📁' },
  { href: '/recurring',    label: 'Recorrentes',  icon: '🔄' },
]
const GENERAL_ITEMS = [
  { href: '/reports',  label: 'Análise',  icon: '📈' },
  { href: '/profile',  label: 'Perfil',   icon: '👤' },
]

interface Props {
  title: string
  children: React.ReactNode
}

export default function Layout({ title, children }: Props) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    try {
      // Usa a rota Next.js /api/logout que sempre limpa os cookies no browser,
      // mesmo que o backend esteja inacessível.
      await fetch('/api/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      router.push('/login')
    }
  }

  useEffect(() => {
    const handleRoute = () => setMobileOpen(false)
    router.events.on('routeChangeStart', handleRoute)
    return () => router.events.off('routeChangeStart', handleRoute)
  }, [router.events])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <span className="sidebar-logo-text">Finanças</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">MENU</div>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="sidebar-section-label">GERAL</div>
          {GENERAL_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none' }}>
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className={`backdrop ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle btn-icon" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>☰</button>
            <h1 className="topbar-title">{title}</h1>
          </div>
          <div className="topbar-right">
            <div className="topbar-avatar">U</div>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
