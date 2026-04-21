'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme'

/** @typedef {'light'|'dark'|'system'} Theme */
/** @type {Record<Theme, Theme>} */
const next = { light: 'dark', dark: 'system', system: 'light' }

/** @type {Record<Theme, import('react').ReactNode>} */
const icons = {
  light:  <Sun size={16} aria-hidden="true" />,
  dark:   <Moon size={16} aria-hidden="true" />,
  system: <Monitor size={16} aria-hidden="true" />,
}

const LABELS = { light: 'Claro', dark: 'Escuro', system: 'Sistema' }

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(next[theme])}
      aria-label={`Tema atual: ${LABELS[theme]}. Clique para alternar`}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                 text-text-secondary transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary"
    >
      {icons[theme]}
    </button>
  )
}
