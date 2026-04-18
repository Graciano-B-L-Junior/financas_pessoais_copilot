import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { apiFetch, formatBRL } from '../lib/api'

const PAGE_SIZE = 10
const fetcher = (url: string) => apiFetch(url).then(r => r.json())

const FREQ_LABELS: Record<string, string> = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' }

interface Category { id: number; name: string }
interface Recurring { id: number; amount: string; description: string; frequency: string; start_date: string; next_date: string; active: boolean; category: number | null; category_name?: string }
interface PagedRec { count: number; results: Recurring[] }

export default function RecurringPage() {
  const [page, setPage] = useState(1)
  const url = `/api/v1/recurring/?page=${page}&page_size=${PAGE_SIZE}`
  const { data, isLoading } = useSWR<PagedRec>(url, fetcher)
  const { data: cats } = useSWR<{ count: number; results: Category[] }>('/api/v1/categories/?page_size=100', fetcher)
  const items = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ amount: '', description: '', frequency: 'monthly', start_date: '', category: '' })
  const [error, setError] = useState('')

  function field(f: Partial<typeof form>) { setForm(prev => ({ ...prev, ...f })) }

  function openNew() { setEditId(null); setForm({ amount: '', description: '', frequency: 'monthly', start_date: new Date().toISOString().slice(0, 10), category: '' }); setShowForm(true); setError('') }
  function openEdit(r: Recurring) { setEditId(r.id); setForm({ amount: r.amount, description: r.description, frequency: r.frequency, start_date: r.start_date, category: r.category?.toString() ?? '' }); setShowForm(true); setError('') }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const body: any = { amount: form.amount, description: form.description, frequency: form.frequency, start_date: form.start_date }
    body.category = form.category ? Number(form.category) : null
    const method = editId ? 'PATCH' : 'POST'
    const path = editId ? `/api/v1/recurring/${editId}/` : '/api/v1/recurring/'
    const res = await apiFetch(path, { method, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); globalMutate(url) }
    else { const d = await res.json(); setError(Object.values(d).flat().join(' ')) }
  }

  async function toggle(r: Recurring) {
    await apiFetch(`/api/v1/recurring/${r.id}/`, { method: 'PATCH', body: JSON.stringify({ active: !r.active }) })
    globalMutate(url)
  }

  async function remove(id: number) {
    if (!confirm('Excluir recorrência?')) return
    await apiFetch(`/api/v1/recurring/${id}/`, { method: 'DELETE' })
    globalMutate(url)
  }

  return (
    <Layout title="Recorrentes">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Lançamentos Recorrentes</span>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Recorrência</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">{editId ? 'Editar' : 'Nova'} Recorrência</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <form onSubmit={submit}>
            <div className="form-inline" style={{ flexWrap: 'wrap' }}>
              <div className="form-group">
                <label>Valor</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => field({ amount: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Descrição</label>
                <input value={form.description} onChange={e => field({ description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Frequência</label>
                <select value={form.frequency} onChange={e => field({ frequency: e.target.value })}>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Data Início</label>
                <input type="date" value={form.start_date} onChange={e => field({ start_date: e.target.value })} required />
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

      <div className="card">
        {isLoading && <p style={{ color: '#6B7280', padding: 16 }}>Carregando...</p>}
        {!isLoading && items.length === 0 && <div className="empty-state">Nenhuma recorrência cadastrada.</div>}
        {items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Frequência</th>
                <th>Próxima</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} style={{ opacity: r.active ? 1 : 0.55 }}>
                  <td>{r.description}</td>
                  <td>{r.category_name || '—'}</td>
                  <td>{FREQ_LABELS[r.frequency] || r.frequency}</td>
                  <td>{r.next_date}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: parseFloat(r.amount) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {formatBRL(parseFloat(r.amount))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${r.active ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggle(r)}>
                      {r.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => openEdit(r)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Excluir</button>
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
