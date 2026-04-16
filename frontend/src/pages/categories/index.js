import useSWR from 'swr'
import { useState } from 'react'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import api from '../../lib/api'
import { formatApiError } from '../../lib/formatters'
import styles from '../../styles/Categories.module.css'

const fetcher = (url) => api.get(url).then((r) => r.data)

const EMPTY = { name: '', type: 'EXPENSE', color: '#8baef7', icon: '', is_active: true }

const ICON_OPTIONS = [
  { value: '', label: 'Sem icone', symbol: '⚪' },
  { value: 'wallet', label: 'Carteira', symbol: '👛' },
  { value: 'home', label: 'Casa', symbol: '🏠' },
  { value: 'food', label: 'Alimentacao', symbol: '🍽️' },
  { value: 'transport', label: 'Transporte', symbol: '🚌' },
  { value: 'health', label: 'Saude', symbol: '💊' },
  { value: 'shopping', label: 'Compras', symbol: '🛍️' },
  { value: 'salary', label: 'Salario', symbol: '💰' },
  { value: 'investment', label: 'Investimento', symbol: '📈' },
  { value: 'education', label: 'Educacao', symbol: '📚' },
]

function getIconSymbol(iconValue) {
  return ICON_OPTIONS.find((option) => option.value === iconValue)?.symbol || '⚪'
}

export default function CategoriesPage() {
  const { data, mutate } = useSWR('/categories/', fetcher)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}/`, form)
      } else {
        await api.post('/categories/', form)
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY)
      mutate()
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Erro ao salvar categoria.'))
    }
  }

  const handleEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon || '', is_active: cat.is_active })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir categoria?')) return
    await api.delete(`/categories/${id}/`)
    mutate()
  }

  const categories = data?.results || data || []
  const incomeCount = categories.filter((category) => category.type === 'INCOME').length
  const activeCount = categories.filter((category) => category.is_active).length

  return (
    <Layout>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Organizacao visual</span>
          <h1>Categorias em cards claros, com leitura imediata por cor, tipo e status.</h1>
          <p>Estruture receitas e despesas em blocos pequenos para manter o dashboard mais confiavel e legivel.</p>
        </div>

        <div className={styles.heroStats}>
          <article>
            <span>Total</span>
            <strong>{categories.length}</strong>
          </article>
          <article>
            <span>Ativas</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Receitas</span>
            <strong>{incomeCount}</strong>
          </article>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>{editing ? 'Edicao' : 'Nova categoria'}</span>
              <h2>{showForm ? 'Defina nome, cor e comportamento' : 'Abra um formulario quando precisar criar ou ajustar uma categoria'}</h2>
            </div>
            <Button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm((current) => !current) }}>
              {showForm ? 'Fechar formulario' : 'Nova categoria'}
            </Button>
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.error}>{error}</p>}

              <label>
                <span>Nome</span>
                <input name="name" value={form.name} onChange={handleChange} required maxLength={100} placeholder="Ex.: Moradia, Alimentacao" />
              </label>

              <div className={styles.formGrid}>
                <label>
                  <span>Tipo</span>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </label>

                <label>
                  <span>Icone</span>
                  <select name="icon" value={form.icon} onChange={handleChange}>
                    {ICON_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.symbol} {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.formGrid}>
                <label>
                  <span>Cor</span>
                  <input type="color" name="color" value={form.color} onChange={handleChange} className={styles.colorInput} />
                </label>

                <label className={styles.toggle}>
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
                  <span>Categoria ativa</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <Button type="submit">{editing ? 'Salvar alteracoes' : 'Criar categoria'}</Button>
                <Button variant="ghost" onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(false) }}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <p className={styles.placeholder}>Use o formulario para manter a taxonomia enxuta, ativa e coerente com o seu fluxo financeiro.</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Biblioteca</span>
              <h2>Suas categorias</h2>
            </div>
          </div>

          <div className={styles.grid}>
            {categories.map((cat) => (
              <div key={cat.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.iconBadgeWrap}>
                    <span className={styles.dot} style={{ background: cat.color }} />
                    <span className={styles.iconBadge}>{getIconSymbol(cat.icon)}</span>
                  </div>
                  <span className={cat.type === 'INCOME' ? styles.income : styles.expense}>
                    {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </span>
                </div>

                <div>
                  <p className={styles.name}>{cat.name}</p>
                  <p className={styles.meta}>
                    {ICON_OPTIONS.find((option) => option.value === cat.icon)?.label || 'Sem icone definido'}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={cat.is_active ? styles.statusActive : styles.statusInactive}>
                    {cat.is_active ? 'Ativa' : 'Inativa'}
                  </span>

                  <div className={styles.actions}>
                    <button type="button" onClick={() => handleEdit(cat)}>Editar</button>
                    <button type="button" onClick={() => handleDelete(cat.id)}>Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </Layout>
  )
}
