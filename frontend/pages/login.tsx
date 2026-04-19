import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { apiFetch } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (router.query?.created) {
      setSuccess('Conta criada com sucesso. Faça login.')
    }
  }, [router.query])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        let errMsg = 'Erro ao fazer login.'
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
        <h1>Entrar</h1>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta? <Link href="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
