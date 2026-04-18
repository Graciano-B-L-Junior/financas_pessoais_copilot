import { useState } from 'react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import { apiFetch, formatBRL, formatDate } from '../lib/api'

const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface CategoryTotal { category__name: string; total: number }
interface MonthlyTrend { month: string; income: number; expense: number }
interface DashboardData {
  start_date: string
  end_date: string
  totals: { income: number; expense: number; balance: number }
  by_category: CategoryTotal[]
  monthly_trend: MonthlyTrend[]
}

function today() { return new Date().toISOString().slice(0, 10) }
function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Dashboard() {
  const [start, setStart] = useState(monthStart())
  const [end, setEnd] = useState(today())
  const { data, error, isLoading } = useSWR<DashboardData>(
    `/api/v1/dashboard/?start_date=${start}&end_date=${end}`,
    fetcher
  )

  return (
    <Layout title="Dashboard">
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>De</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Até</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      {isLoading && <p>Carregando...</p>}
      {error && <p style={{ color: '#EF4444' }}>Erro ao carregar dados.</p>}
      {data && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Receitas</span>
              <span className="stat-value" style={{ color: '#16A34A' }}>{formatBRL(data.totals.income)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Despesas</span>
              <span className="stat-value" style={{ color: '#DC2626' }}>{formatBRL(data.totals.expense)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Saldo</span>
              <span className="stat-value" style={{ color: data.totals.balance >= 0 ? '#16A34A' : '#DC2626' }}>
                {formatBRL(data.totals.balance)}
              </span>
            </div>
          </div>

          {data.by_category.length > 0 && (
            <div className="table-card" style={{ marginTop: 32 }}>
              <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Por Categoria</h2>
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_category.map((item, i) => (
                    <tr key={i}>
                      <td>{item.category__name || 'Sem categoria'}</td>
                      <td style={{ textAlign: 'right' }}>{formatBRL(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.monthly_trend.length > 0 && (
            <div className="table-card" style={{ marginTop: 24 }}>
              <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Tendência Mensal</h2>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: 'right' }}>Receitas</th>
                    <th style={{ textAlign: 'right' }}>Despesas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly_trend.map((item, i) => (
                    <tr key={i}>
                      <td>{formatDate(item.month)}</td>
                      <td style={{ textAlign: 'right', color: '#16A34A' }}>{formatBRL(item.income)}</td>
                      <td style={{ textAlign: 'right', color: '#DC2626' }}>{formatBRL(item.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
