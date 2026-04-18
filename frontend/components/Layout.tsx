import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiFetch } from '../lib/api'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Lançamentos', icon: '💸' },
  { href: '/categories', label: 'Categorias', icon: '🏷️' },
  { href: '/recurring', label: 'Recorrentes', icon: '🔁' },
  { href: '/reports', label: 'Relatórios', icon: '📈' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
]

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export default function Layout({ children, title = 'Finanças Pessoais' }: LayoutProps) {
  const router = useRouter()

  async function handleLogout() {
    await apiFetch('/api/v1/auth/logout/', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <span className="sidebar-logo-name">Finanças</span>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Menu</span>
          {NAV.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={`sidebar-link${router.pathname === item.href ? ' active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <div style={{ flex: 1 }}>
        <header className="topbar">
          <span className="topbar-title">{title}</span>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
