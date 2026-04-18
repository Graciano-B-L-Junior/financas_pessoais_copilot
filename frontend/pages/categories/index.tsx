import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../../components/Layout'
import { apiFetch } from '../../lib/api'

const KEY = '/api/v1/categories/'
const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface Category { id: number; name: string }

export default function Categories() {
  const { data, isLoading } = useSWR<{ results: Category[] }>(KEY, fetcher)
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const categories: Category[] = data?.results ?? (Array.isArray(data) ? data as unknown as Category[] : [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await apiFetch(KEY, { method: 'POST', body: JSON.stringify({ name }) })
    if (res.ok) {
      setName('')
      globalMutate(KEY)
    } else {
      const d = await res.json()
      setError(d.name?.[0] || 'Erro ao criar categoria.')
    }
  }

  async function save(id: number) {
    const res = await apiFetch(`${KEY}${id}/`, { method: 'PATCH', body: JSON.stringify({ name: editName }) })
    if (res.ok) { setEditId(null); globalMutate(KEY) }
  }

  async function remove(id: number) {
    if (!confirm('Excluir categoria?')) return
    await apiFetch(`${KEY}${id}/`, { method: 'DELETE' })
    globalMutate(KEY)
  }

  return (
    <Layout title="Categorias">
      <div className="table-card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Nova Categoria</h2>
        <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Adicionar</button>
        </form>
        {error && <p style={{ color: '#EF4444', marginTop: 8, fontSize: 13 }}>{error}</p>}
      </div>

      <div className="table-card">
        {isLoading && <p>Carregando...</p>}
        {!isLoading && categories.length === 0 && (
          <p style={{ color: '#6B7280', fontSize: 14 }}>Nenhuma categoria cadastrada.</p>
        )}
        {categories.length > 0 && (
          <table>
            <thead>
              <tr><th>Nome</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {editId === cat.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%' }} />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editId === cat.id ? (
                      <>
                        <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => save(cat.id)}>Salvar</button>
                        <button className="btn btn-secondary" onClick={() => setEditId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-secondary" style={{ marginRight: 8 }} onClick={() => { setEditId(cat.id); setEditName(cat.name) }}>Editar</button>
                        <button className="btn btn-danger" onClick={() => remove(cat.id)}>Excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
