import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch } from '../lib/api'

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

  async function logout() {
    await apiFetch('/api/v1/auth/logout/', { method: 'POST' })
    router.push('/login')
  }

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/')

  return (
    <div className="app-shell">
      <aside className="sidebar">
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

      <div className="main-area">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
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
