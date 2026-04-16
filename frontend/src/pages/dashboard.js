import useSWR from 'swr'
import { useState } from 'react'
import Layout from '../components/Layout'
import DashboardChart from '../components/DashboardChart'
import api from '../lib/api'
import { formatCurrency, formatDate } from '../lib/formatters'
import styles from '../styles/Dashboard.module.css'

const fetcher = (url) => api.get(url).then((r) => r.data)

export default function DashboardPage() {
  const [filters, setFilters] = useState({ start: '', end: '', type: '', category: '' })
  const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).toString()
  const { data, isLoading } = useSWR(`/analytics/dashboard/${params ? '?' + params : ''}`, fetcher)
  const { data: recentTransactions } = useSWR('/transactions/?page_size=5', fetcher)
  const { data: categoriesData } = useSWR('/categories/?is_active=true&page_size=100', fetcher)

  const handleFilter = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const categories = categoriesData?.results || categoriesData || []
  const topCategory = data?.por_categoria?.[0]
  const recentItems = recentTransactions?.results || []

  return (
    <Layout>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Visao geral</span>
          <h1>Seu painel financeiro com leitura objetiva e menos ruido visual.</h1>
          <p>Filtre por periodo, categoria e tipo sem perder o contexto dos indicadores principais.</p>
        </div>

        <div className={styles.filterCard}>
          <label>
            <span>Inicio</span>
            <input type="date" name="start" value={filters.start} onChange={handleFilter} />
          </label>

          <label>
            <span>Fim</span>
            <input type="date" name="end" value={filters.end} onChange={handleFilter} />
          </label>

          <label>
            <span>Tipo</span>
            <select name="type" value={filters.type} onChange={handleFilter}>
              <option value="">Todos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </label>

          <label>
            <span>Categoria</span>
            <select name="category" value={filters.category} onChange={handleFilter}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {isLoading ? (
        <div className={styles.loadingCard}>Carregando visao do periodo...</div>
      ) : (
        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.balanceCard}`}>
            <span className={styles.cardLabel}>Saldo total</span>
            <strong className={styles.balanceValue}>{formatCurrency(data?.saldo)}</strong>
            <div className={styles.actionRow}>
              <span className={styles.actionChip}>Receitas {formatCurrency(data?.receitas)}</span>
              <span className={styles.actionChip}>Despesas {formatCurrency(data?.despesas)}</span>
            </div>
          </article>

          <article className={`${styles.card} ${styles.summaryCard}`}>
            <div>
              <span className={styles.cardLabel}>Categoria dominante</span>
              <strong>{topCategory?.category__name || 'Sem destaque ainda'}</strong>
            </div>
            <p>
              {topCategory
                ? `${topCategory.type === 'INCOME' ? 'Receita' : 'Despesa'} em ${formatCurrency(topCategory.total)}`
                : 'Cadastre mais lancamentos para obter comparativos por categoria.'}
            </p>
          </article>

          <article className={`${styles.card} ${styles.listCard}`}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.cardLabel}>Ultimos movimentos</span>
                <h2>Transacoes recentes</h2>
              </div>
            </div>

            <div className={styles.transactionList}>
              {recentItems.length ? recentItems.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionIcon}>{transaction.type === 'INCOME' ? '↗' : '↘'}</div>
                  <div>
                    <strong>{transaction.description || transaction.category_name}</strong>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                  <b className={transaction.type === 'INCOME' ? styles.positive : styles.negative}>
                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount).replace('R$', 'R$ ')}
                  </b>
                </div>
              )) : <p className={styles.emptyCopy}>Nenhum lancamento recente.</p>}
            </div>
          </article>

          <article className={`${styles.card} ${styles.chartCard}`}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.cardLabel}>Distribuicao</span>
                <h2>Totais por categoria</h2>
              </div>
            </div>
            <DashboardChart porCategoria={data?.por_categoria} />
          </article>

          <article className={`${styles.card} ${styles.noteCard}`}>
            <span className={styles.cardLabel}>Leitura rapida</span>
            <h2>O que revisar hoje?</h2>
            <ul className={styles.noteList}>
              <li>Cheque se as despesas passaram do ritmo esperado no periodo.</li>
              <li>Revise a categoria com maior peso para manter o dashboard coerente.</li>
              <li>Use recorrencia apenas em fluxos previsiveis para evitar ruido.</li>
            </ul>
          </article>
        </div>
      )}
    </Layout>
  )
}
