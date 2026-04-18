import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../components/Layout'
import { apiFetch, formatBRL, formatDate } from '../lib/api'

const KEY = '/api/v1/recurrings/'
const CATS_KEY = '/api/v1/categories/'
const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface Category { id: number; name: string }
interface Recurring {
  id: number
  description: string
  amount: string
  frequency: 'daily' | 'weekly' | 'monthly'
  start_date: string
  next_date: string
  active: boolean
  category: number | null
}

const freqLabel: Record<string, string> = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' }

function today() { return new Date().toISOString().slice(0, 10) }

export default function RecurringPage() {
  const { data, isLoading } = useSWR<{ results: Recurring[] }>(KEY, fetcher)
  const { data: catsData } = useSWR<{ results: Category[] }>(CATS_KEY, fetcher)

  const items: Recurring[] = data?.results ?? (Array.isArray(data) ? data as unknown as Recurring[] : [])
  const categories: Category[] = catsData?.results ?? (Array.isArray(catsData) ? catsData as unknown as Category[] : [])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', frequency: 'monthly', start_date: today(), category: '' })
  const [error, setError] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body: Record<string, unknown> = {
      description: form.description,
      amount: form.amount,
      frequency: form.frequency,
      start_date: form.start_date,
    }
    if (form.category) body.category = Number(form.category)
    const res = await apiFetch(KEY, { method: 'POST', body: JSON.stringify(body) })
    if (res.ok) {
      setShowForm(false)
      setForm({ description: '', amount: '', frequency: 'monthly', start_date: today(), category: '' })
      globalMutate(KEY)
    } else {
      const d = await res.json()
      setError(JSON.stringify(d))
    }
  }

  async function toggle(item: Recurring) {
    await apiFetch(`${KEY}${item.id}/`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) })
    globalMutate(KEY)
  }

  async function remove(id: number) {
    if (!confirm('Excluir recorrente?')) return
    await apiFetch(`${KEY}${id}/`, { method: 'DELETE' })
    globalMutate(KEY)
  }

  return (
    <Layout title="Recorrentes">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nova Recorrente'}
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Nova Recorrente</h2>
          <form onSubmit={add}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Valor (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Frequência</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Início</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p style={{ color: '#EF4444', marginTop: 8, fontSize: 13 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Salvar</button>
          </form>
        </div>
      )}

      <div className="table-card">
        {isLoading && <p>Carregando...</p>}
        {!isLoading && items.length === 0 && (
          <p style={{ color: '#6B7280', fontSize: 14 }}>Nenhuma transação recorrente cadastrada.</p>
        )}
        {items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Frequência</th>
                <th>Próxima</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{formatBRL(parseFloat(item.amount))}</td>
                  <td>{freqLabel[item.frequency]}</td>
                  <td>{formatDate(item.next_date)}</td>
                  <td>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                      background: item.active ? '#DCFCE7' : '#F3F4F6',
                      color: item.active ? '#16A34A' : '#6B7280'
                    }}>
                      {item.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary" style={{ marginRight: 8 }} onClick={() => toggle(item)}>
                      {item.active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button className="btn btn-danger" onClick={() => remove(item.id)}>Excluir</button>
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
