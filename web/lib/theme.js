'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const THEMES = /** @type {const} */ (['light', 'dark', 'system'])
/** @typedef {'light'|'dark'|'system'} Theme */

const ThemeContext = createContext({
  theme: /** @type {Theme} */ ('system'),
  setTheme: /** @param {Theme} t */ (t) => {},
})

/** @param {{ children: import('react').ReactNode }} props */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(/** @type {Theme} */('system'))

  useEffect(() => {
    const stored = /** @type {Theme|null} */ (localStorage.getItem('theme'))
    if (stored && THEMES.includes(stored)) setThemeState(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    root.classList.toggle('dark', isDark)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
