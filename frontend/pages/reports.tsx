import { useState } from 'react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import { apiFetch, formatBRL } from '../lib/api'

const fetcher = (url: string) => apiFetch(url).then((r) => r.json())

interface BehaviorData {
  period_days: number
  total_income: number
  total_expense: number
  balance: number
  avg_monthly_expense: number
  top_expense_categories: { category__name: string; total: number }[]
  top_income_categories: { category__name: string; total: number }[]
}

export default function Reports() {
  const { data, isLoading, error } = useSWR<BehaviorData>('/api/v1/analytics/behavior/', fetcher)

  return (
    <Layout title="Análise de Comportamento">
      {isLoading && <p>Carregando análise...</p>}
      {error && <p style={{ color: '#EF4444' }}>Erro ao carregar análise.</p>}
      {data && (
        <>
          <div className="stats-grid" style={{ marginBottom: 32 }}>
            <div className="stat-card">
              <span className="stat-label">Receitas (90 dias)</span>
              <span className="stat-value" style={{ color: '#16A34A' }}>{formatBRL(data.total_income)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Despesas (90 dias)</span>
              <span className="stat-value" style={{ color: '#DC2626' }}>{formatBRL(data.total_expense)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Saldo</span>
              <span className="stat-value" style={{ color: data.balance >= 0 ? '#16A34A' : '#DC2626' }}>{formatBRL(data.balance)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Média Mensal (despesa)</span>
              <span className="stat-value">{formatBRL(data.avg_monthly_expense)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {data.top_expense_categories.length > 0 && (
              <div className="table-card">
                <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Top Despesas por Categoria</h2>
                <table>
                  <thead><tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                  <tbody>
                    {data.top_expense_categories.map((item, i) => (
                      <tr key={i}>
                        <td>{item.category__name || 'Sem categoria'}</td>
                        <td style={{ textAlign: 'right', color: '#DC2626' }}>{formatBRL(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.top_income_categories.length > 0 && (
              <div className="table-card">
                <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Top Receitas por Categoria</h2>
                <table>
                  <thead><tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                  <tbody>
                    {data.top_income_categories.map((item, i) => (
                      <tr key={i}>
                        <td>{item.category__name || 'Sem categoria'}</td>
                        <td style={{ textAlign: 'right', color: '#16A34A' }}>{formatBRL(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
