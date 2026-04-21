import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout } from './api'

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async (email, password) => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Tenta recuperar o usuário a partir do token em sessionStorage na montagem
  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data } = await apiLogin(email, password)
    sessionStorage.setItem('access_token', data.access)
    sessionStorage.setItem('user', JSON.stringify(data.user ?? { email }))
    setUser(data.user ?? { email })
  }, [])

  const signOut = useCallback(async () => {
    try { await apiLogout() } catch {}
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
