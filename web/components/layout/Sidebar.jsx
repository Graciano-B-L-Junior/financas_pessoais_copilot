'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  X,
  Menu,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { slideSidebar } from '@/lib/motion'
import { useAuth } from '@/lib/auth'

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight,   label: 'Transações' },
  { href: '/categories',   icon: Tag,              label: 'Categorias' },
  { href: '/profile',      icon: User,             label: 'Perfil' },
]

function NavContent({ onClose }) {
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
          <TrendingUp size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary leading-none">Finanças</p>
          <p className="text-xs text-text-muted">Pessoais</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegação principal">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Insight banner */}
      <div className="mx-3 mb-4 rounded-xl bg-[#4CAF50]/10 p-4 border border-[#4CAF50]/20">
        <p className="text-xs font-medium text-primary mb-2">💡 Dica do mês</p>
        <p className="text-xs text-text-secondary">Reserve 20% da sua renda antes de gastar.</p>
        <Link href="/dashboard" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ver análise <ChevronRight size={12} />
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[var(--color-border)] pt-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#EF4444] transition-colors duration-150"
        >
          <LogOut size={18} aria-hidden="true" />
          Sair
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-bg-sidebar border-r border-[var(--color-border)] h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-bg-card border border-[var(--color-border)] shadow-sm text-text-secondary"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            <motion.aside
              key="drawer"
              variants={slideSidebar}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 h-full w-[260px] z-50 bg-bg-sidebar border-r border-[var(--color-border)] md:hidden"
            >
              <NavContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
