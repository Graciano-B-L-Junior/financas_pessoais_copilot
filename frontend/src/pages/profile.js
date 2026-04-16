import useSWR from 'swr'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { updateProfile } from '../lib/auth'
import api from '../lib/api'
import { formatApiError, formatCurrency, formatPercent, getInitials } from '../lib/formatters'
import styles from '../styles/Profile.module.css'

const fetcher = (url) => api.get(url).then((r) => r.data)

export default function ProfilePage() {
  const { data: user, mutate } = useSWR('/auth/profile/', fetcher)
  const { data: analytics } = useSWR('/analytics/profile/', fetcher)
  const [form, setForm] = useState({ name: '', date_of_birth: '', locale: 'pt-BR', currency: 'BRL' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        date_of_birth: user.date_of_birth || '',
        locale: user.locale || 'pt-BR',
        currency: user.currency || 'BRL',
      })
    }
  }, [user])

  const startEdit = () => {
    setEditing(true)
  }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateProfile(form)
      await mutate()
      setEditing(false)
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Nao foi possivel salvar o perfil.'))
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <Layout><p>Carregando...</p></Layout>

  return (
    <Layout>
      <section className={styles.hero}>
        <article className={styles.profileCard}>
          <div className={styles.avatar}>{getInitials(user.name)}</div>
          <div>
            <span className={styles.eyebrow}>Perfil</span>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
          <Button onClick={startEdit}>{editing ? 'Editando' : 'Editar perfil'}</Button>
        </article>

        <div className={styles.metrics}>
          <article>
            <span>Receitas totais</span>
            <strong>{formatCurrency(analytics?.total_receitas)}</strong>
          </article>
          <article>
            <span>Despesas totais</span>
            <strong>{formatCurrency(analytics?.total_despesas)}</strong>
          </article>
          <article>
            <span>Taxa de poupanca</span>
            <strong>{formatPercent(analytics?.taxa_poupanca_percentual)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.panel}>
          <span className={styles.panelLabel}>Dados atuais</span>
          <h2>Informacoes da conta</h2>

          <div className={styles.infoGrid}>
            <div>
              <span>Nome</span>
              <strong>{user.name}</strong>
            </div>
            <div>
              <span>Nascimento</span>
              <strong>{user.date_of_birth || 'Nao informado'}</strong>
            </div>
            <div>
              <span>Moeda</span>
              <strong>{user.currency}</strong>
            </div>
            <div>
              <span>Locale</span>
              <strong>{user.locale}</strong>
            </div>
          </div>

          <div className={styles.highlight}>
            <span>Categoria de maior despesa</span>
            <strong>{analytics?.maior_categoria_despesa?.category__name || 'Sem leitura ainda'}</strong>
          </div>
        </article>

        <article className={styles.panel}>
          <span className={styles.panelLabel}>Ajustes</span>
          <h2>{editing ? 'Atualize os detalhes do perfil' : 'Abra o modo de edicao para ajustar preferencias e dados pessoais'}</h2>

          {editing ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.error}>{error}</p>}

              <label>
                <span>Nome</span>
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>

              <div className={styles.formGrid}>
                <label>
                  <span>Nascimento</span>
                  <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                </label>

                <label>
                  <span>Moeda</span>
                  <input name="currency" value={form.currency} onChange={handleChange} maxLength={3} />
                </label>
              </div>

              <label>
                <span>Locale</span>
                <input name="locale" value={form.locale} onChange={handleChange} maxLength={10} />
              </label>

              <div className={styles.actions}>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alteracoes'}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </form>
          ) : (
            <p className={styles.placeholder}>Mantenha moeda, locale e dados pessoais alinhados ao seu uso real para que os resumos do sistema fiquem consistentes.</p>
          )}
        </article>
      </section>
    </Layout>
  )
}
