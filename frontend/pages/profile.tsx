import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../components/Layout'
import { apiFetch } from '../lib/api'

const KEY = '/api/v1/profile/'
const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface Profile {
  id: number
  username: string
  email: string
  profile: { full_name: string; bio: string }
}

export default function ProfilePage() {
  const { data, isLoading } = useSWR<Profile>(KEY, fetcher)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name || '')
      setBio(data.profile.bio || '')
    }
  }, [data])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError('')
    const res = await apiFetch(KEY, {
      method: 'PUT',
      body: JSON.stringify({ profile: { full_name: fullName, bio } }),
    })
    if (res.ok) {
      setSuccess(true)
      globalMutate(KEY)
    } else {
      const d = await res.json()
      setError(JSON.stringify(d))
    }
  }

  return (
    <Layout title="Perfil">
      <div className="table-card" style={{ maxWidth: 480 }}>
        {isLoading && <p>Carregando...</p>}
        {data && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 2 }}>Usuário</p>
              <p style={{ fontWeight: 600 }}>{data.username}</p>
            </div>
            {data.email && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 2 }}>E-mail</p>
                <p>{data.email}</p>
              </div>
            )}
            <form onSubmit={save}>
              <div className="form-group">
                <label>Nome completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="form-group">
                <label>Sobre mim</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Uma frase sobre você"
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              {success && <p style={{ color: '#16A34A', fontSize: 13, marginBottom: 12 }}>Perfil atualizado!</p>}
              {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" className="btn btn-primary">Salvar</button>
            </form>
          </>
        )}
      </div>
    </Layout>
  )
}
