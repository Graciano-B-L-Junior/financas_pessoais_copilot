import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../../components/Layout'
import Pagination from '../../components/Pagination'
import { apiFetch, formatBRL, formatDate } from '../../lib/api'

const PAGE_SIZE = 15
const fetcher = (url: string) => apiFetch(url).then(r => r.json())

interface Category { id: number; name: string }
interface Transaction { id: number; amount: string; description: string; date: string; category: number | null; category_name?: string }
interface PagedTx { count: number; results: Transaction[] }

export default function Transactions() {
  const [page, setPage] = useState(1)
  const [filterCat, setFilterCat] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  let url = `/api/v1/transactions/?page=${page}&page_size=${PAGE_SIZE}&ordering=-date`
  if (filterCat) url += `&category=${filterCat}`
  if (filterStart) url += `&date_after=${filterStart}`
  if (filterEnd) url += `&date_before=${filterEnd}`

  const { data, isLoading } = useSWR<PagedTx>(url, fetcher)
  const { data: cats } = useSWR<{ count: number; results: Category[] }>('/api/v1/categories/?page_size=100', fetcher)
  const txs = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ amount: '', description: '', date: '', category: '' })
  const [error, setError] = useState('')

  function field(f: Partial<typeof form>) { setForm(prev => ({ ...prev, ...f })) }

  function openNew() { setEditId(null); setForm({ amount: '', description: '', date: new Date().toISOString().slice(0, 10), category: '' }); setShowForm(true); setError('') }
  function openEdit(t: Transaction) { setEditId(t.id); setForm({ amount: t.amount, description: t.description, date: t.date, category: t.category?.toString() ?? '' }); setShowForm(true); setError('') }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const body: any = { amount: form.amount, description: form.description, date: form.date }
    if (form.category) body.category = Number(form.category)
    else body.category = null
    const method = editId ? 'PATCH' : 'POST'
    const path = editId ? `/api/v1/transactions/${editId}/` : '/api/v1/transactions/'
    const res = await apiFetch(path, { method, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); globalMutate(url) }
    else { const d = await res.json(); setError(Object.values(d).flat().join(' ')) }
  }

  async function remove(id: number) {
    if (!confirm('Excluir lançamento?')) return
    await apiFetch(`/api/v1/transactions/${id}/`, { method: 'DELETE' })
    globalMutate(url)
  }

  return (
    <Layout title="Lançamentos">
      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Filtros</span>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Lançamento</button>
        </div>
        <div className="form-inline" style={{ flexWrap: 'wrap' }}>
          <div className="form-group">
            <label>Categoria</label>
            <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
              <option value="">Todas</option>
              {(cats?.results ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>De</label>
            <input type="date" value={filterStart} onChange={e => { setFilterStart(e.target.value); setPage(1) }} />
          </div>
          <div className="form-group">
            <label>Até</label>
            <input type="date" value={filterEnd} onChange={e => { setFilterEnd(e.target.value); setPage(1) }} />
          </div>
        </div>
      </div>

      {/* Form overlay */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">{editId ? 'Editar Lançamento' : 'Novo Lançamento'}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <form onSubmit={submit}>
            <div className="form-inline" style={{ flexWrap: 'wrap' }}>
              <div className="form-group">
                <label>Valor (positivo = receita, negativo = despesa)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => field({ amount: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Descrição</label>
                <input value={form.description} onChange={e => field({ description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={form.date} onChange={e => field({ date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.category} onChange={e => field({ category: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {(cats?.results ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="auth-error" style={{ margin: '8px 0' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Criar'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {isLoading && <p style={{ color: '#6B7280', padding: 16 }}>Carregando...</p>}
        {!isLoading && txs.length === 0 && <div className="empty-state">Nenhum lançamento encontrado.</div>}
        {txs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(t => {
                const v = parseFloat(t.amount)
                return (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td>{t.category_name || '—'}</td>
                    <td style={{ textAlign: 'right', color: v >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      {formatBRL(v)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => openEdit(t)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t.id)}>Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </Layout>
  )
}
