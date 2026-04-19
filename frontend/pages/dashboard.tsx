import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import { apiFetch, formatBRL } from '../lib/api'

const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

const COLORS = ['#1A3C2B', '#2E6B4A', '#4CAF7A', '#D1FAE5', '#6B7280', '#F97316', '#EAB308', '#EF4444']

function today() { return new Date().toISOString().slice(0, 10) }
function monthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

interface DashboardData {
  totals: { income: number; expense: number; balance: number }
  by_category: { category__name: string; total: number }[]
  monthly_trend: { month: string; income: number; expense: number }[]
}

export default function Dashboard() {
  const [start, setStart] = useState(monthStart())
  const [end, setEnd] = useState(today())
  const { data, isLoading } = useSWR<DashboardData>(
    `/api/v1/dashboard/?start_date=${start}&end_date=${end}`,
    fetcher
  )

  // Protege acessos quando API não retornar `totals`
  const totals = data?.totals ?? { income: 0, expense: 0, balance: 0 }

  const pieData = (data?.by_category || [])
    .filter((c) => c.total !== 0)
    .map((c) => ({ name: c.category__name || 'Sem categoria', value: Math.abs(c.total) }))

  const barData = (data?.monthly_trend || []).map((m) => ({
    month: m.month.slice(0, 7),
    Receitas: m.income,
    Despesas: m.expense,
  }))

  return (
    <Layout title="Dashboard">
      <div className="form-inline" style={{ marginBottom: 24 }}>
        <div className="form-group">
          <label>De</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Até</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      {isLoading && <p style={{ color: '#6B7280' }}>Carregando...</p>}

      {data && (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            <div className="stat-card hero">
                <span className="stat-label">Saldo do Período</span>
                <span className="stat-value">{formatBRL(totals.balance)}</span>
                <span className={`stat-trend ${totals.balance >= 0 ? 'up' : 'down'}`}>
                  {totals.balance >= 0 ? '↑ Positivo' : '↓ Negativo'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Receitas</span>
                <span className="stat-value" style={{ color: '#22C55E' }}>{formatBRL(totals.income)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Despesas</span>
                <span className="stat-value" style={{ color: '#EF4444' }}>{formatBRL(totals.expense)}</span>
              </div>
          </div>

          {/* Charts grid */}
          <div className="grid-2">
            {/* Bar chart — monthly trend */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tendência Mensal</span>
              </div>
              <div className="chart-container">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                      <Legend />
                      <Bar dataKey="Receitas" fill="#1A3C2B" radius={[4,4,0,0]} />
                      <Bar dataKey="Despesas" fill="#4CAF7A" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Sem dados no período</div>
                )}
              </div>
            </div>

            {/* Pie chart — by category */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Por Categoria</span>
              </div>
              <div className="chart-container">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Sem dados no período</div>
                )}
              </div>
            </div>
          </div>

          {/* Category table */}
          {(data.by_category || []).length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <span className="card-title">Detalhamento por Categoria</span>
              </div>
              <table>
                <thead>
                  <tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                </thead>
                <tbody>
                  {data.by_category.map((c, i) => (
                    <tr key={i}>
                      <td>{c.category__name || 'Sem categoria'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(c.total)}</td>
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
