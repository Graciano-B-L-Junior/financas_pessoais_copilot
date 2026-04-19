import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { apiFetch } from '../lib/api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })
      if (res.ok) {
        // Redirect to login after successful registration to avoid
        // relying on automatic cookie-auth in environments where
        // cross-site cookies or samesite policies prevent them from
        // being set immediately.
        router.push('/login?created=1')
      } else {
        let errMsg = 'Erro ao criar conta.'
        try {
          const data = await res.json()
          errMsg = data?.detail ?? JSON.stringify(data) ?? errMsg
        } catch (parseErr) {
          errMsg = `${res.status} ${res.statusText}`
        }
        setError(errMsg)
      }
    } catch (e: any) {
      setError('Erro de conexão: ' + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-circle">F</div>
        </div>
        <h1>Criar conta</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Usuário</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </div>
      </div>
    </div>
  )
}
