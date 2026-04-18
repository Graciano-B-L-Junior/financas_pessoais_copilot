import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Layout from '../../components/Layout'
import { apiFetch, formatBRL, formatDate } from '../../lib/api'

const CATS_KEY = '/api/v1/categories/'
const TX_BASE = '/api/v1/transactions/'
const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface Category { id: number; name: string }
interface Transaction {
  id: number
  description: string
  amount: string
  date: string
  transaction_type: 'income' | 'expense'
  category: number | null
  category_name?: string
}

function today() { return new Date().toISOString().slice(0, 10) }
function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Transactions() {
  const [start, setStart] = useState(monthStart())
  const [end, setEnd] = useState(today())
  const [filterCat, setFilterCat] = useState('')

  const txKey = `${TX_BASE}?start_date=${start}&end_date=${end}${filterCat ? `&category=${filterCat}` : ''}`
  const { data: txData, isLoading } = useSWR<{ results: Transaction[] }>(txKey, fetcher)
  const { data: catsData } = useSWR<{ results: Category[] }>(CATS_KEY, fetcher)

  const transactions: Transaction[] = txData?.results ?? (Array.isArray(txData) ? txData as unknown as Transaction[] : [])
  const categories: Category[] = catsData?.results ?? (Array.isArray(catsData) ? catsData as unknown as Category[] : [])

  const [form, setForm] = useState({ description: '', amount: '', date: today(), transaction_type: 'expense', category: '' })
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body: Record<string, unknown> = {
      description: form.description,
      amount: form.amount,
      date: form.date,
      transaction_type: form.transaction_type,
    }
    if (form.category) body.category = Number(form.category)
    const res = await apiFetch(TX_BASE, { method: 'POST', body: JSON.stringify(body) })
    if (res.ok) {
      setForm({ description: '', amount: '', date: today(), transaction_type: 'expense', category: '' })
      setShowForm(false)
      globalMutate(txKey)
    } else {
      const d = await res.json()
      setError(JSON.stringify(d))
    }
  }

  async function remove(id: number) {
    if (!confirm('Excluir lançamento?')) return
    await apiFetch(`${TX_BASE}${id}/`, { method: 'DELETE' })
    globalMutate(txKey)
  }

  return (
    <Layout title="Lançamentos">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>De</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Até</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Categoria</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginBottom: 0 }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Lançamento'}
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Novo Lançamento</h2>
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
                <label>Data</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tipo</label>
                <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
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
        {!isLoading && transactions.length === 0 && (
          <p style={{ color: '#6B7280', fontSize: 14 }}>Nenhum lançamento no período.</p>
        )}
        {transactions.length > 0 && (
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
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{tx.description}</td>
                  <td>{tx.category_name || '—'}</td>
                  <td style={{ textAlign: 'right', color: tx.transaction_type === 'income' ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                    {tx.transaction_type === 'income' ? '+' : '-'}{formatBRL(parseFloat(tx.amount))}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger" onClick={() => remove(tx.id)}>Excluir</button>
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
