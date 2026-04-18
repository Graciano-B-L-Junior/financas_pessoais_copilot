import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { apiFetch } from '../lib/api'

const fetcher = (url: string) => apiFetch(url).then(r => r.json())

export default function Profile() {
  const router = useRouter()
  const { data, isLoading } = useSWR('/api/v1/accounts/profile/', fetcher)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    if (data) { setUsername(data.username || ''); setEmail(data.email || '') }
  }, [data])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('')
    const res = await apiFetch('/api/v1/accounts/profile/', { method: 'PUT', body: JSON.stringify({ username, email }) })
    if (res.ok) { setSuccess('Perfil atualizado.'); globalMutate('/api/v1/accounts/profile/') }
    else { const d = await res.json(); setError(Object.values(d).flat().join(' ')) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(''); setPwSuccess('')
    if (pwForm.new_password !== pwForm.confirm) { setPwError('As senhas não coincidem.'); return }
    const res = await apiFetch('/api/v1/accounts/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password: pwForm.old_password, new_password: pwForm.new_password }),
    })
    if (res.ok) { setPwSuccess('Senha alterada.'); setPwForm({ old_password: '', new_password: '', confirm: '' }) }
    else { const d = await res.json(); setPwError(Object.values(d).flat().join(' ')) }
  }

  async function doLogout() {
    await apiFetch('/api/v1/auth/logout/', { method: 'POST' })
    router.push('/login')
  }

  if (isLoading) return <Layout title="Perfil"><p style={{ color: '#6B7280' }}>Carregando...</p></Layout>

  return (
    <Layout title="Perfil">
      <div className="grid-2">
        {/* Profile card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Dados do Perfil</span></div>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Usuário</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <p className="auth-error" style={{ marginBottom: 8 }}>{error}</p>}
            {success && <p style={{ color: 'var(--color-success)', marginBottom: 8, fontSize: 14 }}>{success}</p>}
            <button type="submit" className="btn btn-primary">Salvar</button>
          </form>
        </div>

        {/* Password card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Alterar Senha</span></div>
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Senha Atual</label>
              <input type="password" value={pwForm.old_password} onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Nova Senha</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Confirmar Nova Senha</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            {pwError && <p className="auth-error" style={{ marginBottom: 8 }}>{pwError}</p>}
            {pwSuccess && <p style={{ color: 'var(--color-success)', marginBottom: 8, fontSize: 14 }}>{pwSuccess}</p>}
            <button type="submit" className="btn btn-primary">Alterar Senha</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
        <button className="btn btn-danger" onClick={doLogout}>Sair da conta</button>
      </div>
    </Layout>
  )
}
