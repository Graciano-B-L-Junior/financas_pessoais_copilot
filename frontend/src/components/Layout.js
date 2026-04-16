import Link from 'next/link'
import { useRouter } from 'next/router'
import { logout } from '../lib/auth'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/transactions', label: 'Lançamentos' },
    { href: '/categories', label: 'Categorias' },
    { href: '/profile', label: 'Perfil' },
  ]

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.brandGroup}>
            <Link href="/dashboard" className={styles.brand}>
              <span className={styles.brandMark}>◌</span>
              <span>Bankio</span>
            </Link>
            <p className={styles.brandCopy}>Financas pessoais com leitura clara e diaria.</p>
          </div>

          <nav className={styles.nav} aria-label="Navegacao principal">
            <ul className={styles.links}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={router.pathname === link.href ? styles.active : ''}>
                {link.label}
              </Link>
            </li>
          ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <label className={styles.search}>
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="Buscar area" aria-label="Buscar area" />
            </label>

            <button className={styles.logout} onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
