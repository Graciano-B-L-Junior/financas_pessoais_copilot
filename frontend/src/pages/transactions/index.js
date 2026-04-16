import useSWR from 'swr'
import { useState } from 'react'
import Layout from '../../components/Layout'
import TransactionForm from '../../components/TransactionForm'
import Button from '../../components/Button'
import api from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/formatters'
import styles from '../../styles/Transactions.module.css'

const fetcher = (url) => api.get(url).then((r) => r.data)

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ type: '', category: '', start_date: '', end_date: '', is_recurring: '' })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const params = new URLSearchParams({ page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }).toString()
  const { data, mutate } = useSWR(`/transactions/?${params}`, fetcher)
  const { data: categoriesData } = useSWR('/categories/?is_active=true&page_size=100', fetcher)

  const handleFilter = (e) => { setFilters((p) => ({ ...p, [e.target.name]: e.target.value })); setPage(1) }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este lançamento?')) return
    await api.delete(`/transactions/${id}/`)
    mutate()
  }

  const handleSuccess = () => { setShowForm(false); setEditing(null); mutate() }
  const transactions = data?.results || []
  const categories = categoriesData?.results || categoriesData || []
  const totals = transactions.reduce((summary, transaction) => {
    if (transaction.type === 'INCOME') {
      summary.income += Number(transaction.amount)
    } else {
      summary.expense += Number(transaction.amount)
    }

    return summary
  }, { income: 0, expense: 0 })

  return (
    <Layout>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Fluxo diario</span>
          <h1>Lancamentos em uma lista leve, com filtros curtos e contexto suficiente para agir rapido.</h1>
        </div>

        <div className={styles.heroStats}>
          <article>
            <span>No periodo visivel</span>
            <strong>{transactions.length}</strong>
          </article>
          <article>
            <span>Receitas</span>
            <strong>{formatCurrency(totals.income)}</strong>
          </article>
          <article>
            <span>Despesas</span>
            <strong>{formatCurrency(totals.expense)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.pageLayout}>
        <article className={styles.sidePanel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelLabel}>Filtros</span>
              <h2>Ajuste a leitura da lista</h2>
            </div>
            <Button onClick={() => { setEditing(null); setShowForm((value) => !value) }}>
              {showForm ? 'Fechar formulario' : 'Novo lancamento'}
            </Button>
          </div>

          <div className={styles.filters}>
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

            <label>
              <span>Inicio</span>
              <input type="date" name="start_date" value={filters.start_date} onChange={handleFilter} />
            </label>

            <label>
              <span>Fim</span>
              <input type="date" name="end_date" value={filters.end_date} onChange={handleFilter} />
            </label>

            <label>
              <span>Recorrencia</span>
              <select name="is_recurring" value={filters.is_recurring} onChange={handleFilter}>
                <option value="">Todos</option>
                <option value="true">Recorrentes</option>
                <option value="false">Pontuais</option>
              </select>
            </label>
          </div>

          {showForm && (
            <div className={styles.formWrap}>
              <TransactionForm initialData={editing} onSuccess={handleSuccess} onCancel={() => { setShowForm(false); setEditing(null) }} />
            </div>
          )}
        </article>

        <article className={styles.listPanel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelLabel}>Lista</span>
              <h2>Movimentos recentes</h2>
            </div>
          </div>

          <div className={styles.list}>
            {transactions.length ? transactions.map((transaction) => (
              <div key={transaction.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <div>
                    <span className={styles.itemDate}>{formatDate(transaction.date)}</span>
                    <h3>{transaction.description || transaction.category_name}</h3>
                  </div>
                  <strong className={transaction.type === 'INCOME' ? styles.income : styles.expense}>
                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </strong>
                </div>

                <div className={styles.itemMeta}>
                  <span>{transaction.category_name}</span>
                  <span>{transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}</span>
                  <span>{transaction.is_recurring ? 'Recorrente' : 'Pontual'}</span>
                </div>

                <div className={styles.itemActions}>
                  <button type="button" onClick={() => { setEditing(transaction); setShowForm(true) }}>Editar</button>
                  <button type="button" onClick={() => handleDelete(transaction.id)}>Excluir</button>
                </div>
              </div>
            )) : <p className={styles.emptyState}>Nenhum lancamento encontrado para os filtros atuais.</p>}
          </div>

          <div className={styles.pagination}>
            <Button variant="ghost" disabled={!data?.previous} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span>Pagina {page}</span>
            <Button variant="ghost" disabled={!data?.next} onClick={() => setPage((p) => p + 1)}>Proxima</Button>
          </div>
        </article>
      </section>
    </Layout>
  )
}
