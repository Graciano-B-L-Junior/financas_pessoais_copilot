import { useEffect, useState } from 'react'
import useSWR from 'swr'
import api from '../lib/api'
import Button from './Button'
import { formatApiError } from '../lib/formatters'
import styles from './TransactionForm.module.css'

const fetcher = (url) => api.get(url).then((r) => r.data.results || r.data)

const buildInitialState = (initialData) => ({
  category: initialData?.category || '',
  amount: initialData?.amount || '',
  description: initialData?.description || '',
  date: initialData?.date || new Date().toISOString().slice(0, 10),
  type: initialData?.type || 'EXPENSE',
  is_recurring: Boolean(initialData?.is_recurring),
  frequency: initialData?.frequency || '',
})

export default function TransactionForm({ onSuccess, initialData, onCancel }) {
  const { data: categories } = useSWR('/categories/?is_active=true&page_size=100', fetcher)
  const [form, setForm] = useState(buildInitialState(initialData))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setForm(buildInitialState(initialData))
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type: t, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: t === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (initialData?.id) {
        await api.patch(`/transactions/${initialData.id}/`, form)
      } else {
        await api.post('/transactions/', form)
      }
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data || 'Erro ao salvar lançamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>{initialData?.id ? 'Edicao' : 'Novo lancamento'}</span>
          <h2>{initialData?.id ? 'Ajuste os dados do lancamento' : 'Registre um movimento com contexto'}</h2>
        </div>
        <p>Use categorias, recorrencia e descricao curta para manter a leitura do dashboard limpa.</p>
      </div>

      {error && <p className={styles.error}>{formatApiError(error, 'Erro ao salvar lancamento.')}</p>}

      <div className={styles.grid}>
        <label>
          <span>Tipo</span>
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
        </label>

        <label>
          <span>Categoria</span>
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Selecione</option>
            {(categories || [])
              .filter((category) => category.type === form.type && category.is_active)
              .map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
          </select>
        </label>

        <label>
          <span>Valor</span>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} step="0.01" min="0.01" required />
        </label>

        <label>
          <span>Data</span>
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>
      </div>

      <label>
        <span>Descricao</span>
        <input type="text" name="description" value={form.description} onChange={handleChange} maxLength={255} placeholder="Ex.: supermercado, salario, assinatura" />
      </label>

      <div className={styles.recurringBlock}>
        <label className={styles.checkbox}>
          <input type="checkbox" name="is_recurring" checked={form.is_recurring} onChange={handleChange} />
          <span>Transformar em recorrente</span>
        </label>

        {form.is_recurring && (
          <label>
            <span>Frequencia</span>
            <select name="frequency" value={form.frequency} onChange={handleChange} required>
              <option value="">Selecione</option>
              <option value="DAILY">Diario</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </label>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Salvando...' : initialData?.id ? 'Salvar alteracoes' : 'Criar lancamento'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
