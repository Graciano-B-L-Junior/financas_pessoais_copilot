import { useState } from 'react'
import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Layout from '../components/Layout'
import { apiFetch, formatBRL } from '../lib/api'

const fetcher = (url: string) => apiFetch(url).then(r => r.json())
const COLORS = ['#1A3C2B', '#4CAF7A', '#2E7D52', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#66BB6A']

interface BehaviorData {
  total_income: number
  total_expense: number
  balance: number
  avg_monthly_expense: number
  top_expense_categories: { category__name: string; total: number }[]
  top_income_categories: { category__name: string; total: number }[]
}

export default function Reports() {
  const [days, setDays] = useState(90)
  const { data, isLoading } = useSWR<BehaviorData>(`/api/v1/analytics/behavior/?days=${days}`, fetcher)

  const expensePie = data?.top_expense_categories?.map(c => ({ name: c.category__name || 'Sem categoria', value: c.total })) ?? []
  const incomePie = data?.top_income_categories?.map(c => ({ name: c.category__name || 'Sem categoria', value: c.total })) ?? []

  const summaryBars = data ? [
    { name: 'Receitas', value: data.total_income },
    { name: 'Despesas', value: data.total_expense },
    { name: 'Saldo', value: data.balance },
  ] : []

  return (
    <Layout title="Análise">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Análise de Comportamento Financeiro</span>
          <div className="form-group" style={{ margin: 0 }}>
            <select value={days} onChange={e => setDays(Number(e.target.value))}>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={180}>Últimos 180 dias</option>
              <option value={365}>Último ano</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && <p style={{ color: '#6B7280', padding: 16 }}>Carregando...</p>}

      {data && (
        <>
          {/* Stat cards */}
          <div className="stat-grid">
            <div className="stat-card hero">
              <span className="stat-label">Saldo</span>
              <span className="stat-value">{formatBRL(data.balance)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Receitas</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>{formatBRL(data.total_income)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Despesas</span>
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{formatBRL(data.total_expense)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Média Mensal (Despesas)</span>
              <span className="stat-value">{formatBRL(data.avg_monthly_expense)}</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-title">Resumo do Período</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summaryBars}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={v => formatBRL(v)} />
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                    <Bar dataKey="value" fill="#4CAF7A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Top Despesas por Categoria</span></div>
              <div className="chart-container">
                {expensePie.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {expensePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state">Sem dados de despesas.</div>}
              </div>
            </div>
          </div>

          {/* Top income categories */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Top Receitas por Categoria</span></div>
            {incomePie.length > 0 ? (
              <table>
                <thead>
                  <tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                </thead>
                <tbody>
                  {incomePie.map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>{formatBRL(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="empty-state">Sem dados de receitas.</div>}
          </div>
        </>
      )}
    </Layout>
  )
}
