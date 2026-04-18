import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../../components/Layout'
import Pagination from '../../components/Pagination'
import { apiFetch } from '../../lib/api'

const PAGE_SIZE = 10
const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface Category { id: number; name: string }
interface PagedResp { count: number; results: Category[] }

export default function Categories() {
  const [page, setPage] = useState(1)
  const key = `/api/v1/categories/?page=${page}&page_size=${PAGE_SIZE}`
  const { data, isLoading } = useSWR<PagedResp>(key, fetcher)

  const categories = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1

  const [name, setName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await apiFetch('/api/v1/categories/', { method: 'POST', body: JSON.stringify({ name }) })
    if (res.ok) { setName(''); globalMutate(key) }
    else { const d = await res.json(); setError(d.name?.[0] || 'Erro ao criar.') }
  }

  async function save(id: number) {
    const res = await apiFetch(`/api/v1/categories/${id}/`, { method: 'PATCH', body: JSON.stringify({ name: editName }) })
    if (res.ok) { setEditId(null); globalMutate(key) }
  }

  async function remove(id: number) {
    if (!confirm('Excluir categoria?')) return
    await apiFetch(`/api/v1/categories/${id}/`, { method: 'DELETE' })
    globalMutate(key)
  }

  return (
    <Layout title="Categorias">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Nova Categoria</span>
        </div>
        <form onSubmit={add} className="form-inline">
          <div className="form-group" style={{ flex: 1 }}>
            <input placeholder="Nome da categoria" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Adicionar</button>
        </form>
        {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      <div className="card">
        {isLoading && <p style={{ color: '#6B7280', padding: 16 }}>Carregando...</p>}
        {!isLoading && categories.length === 0 && <div className="empty-state">Nenhuma categoria cadastrada.</div>}
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
                    ) : cat.name}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editId === cat.id ? (
                      <>
                        <button className="btn btn-primary btn-sm" style={{ marginRight: 8 }} onClick={() => save(cat.id)}>Salvar</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => { setEditId(cat.id); setEditName(cat.name) }}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(cat.id)}>Excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </Layout>
  )
}
