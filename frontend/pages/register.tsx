import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { apiFetch } from '../lib/api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await apiFetch('/api/v1/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.detail || 'Erro ao criar conta.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1A3C2B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>F</div>
        </div>
        <h1>Criar conta</h1>
        {error && <p style={{ color: '#EF4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Usuário</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>E-mail (opcional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
            Criar conta
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: '#6B7280' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#1A3C2B', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
