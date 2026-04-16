import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { login } from '../lib/auth'
import Button from '../components/Button'
import { formatApiError } from '../lib/formatters'
import styles from '../styles/Auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(form.email, form.password)
      const next = Array.isArray(router.query.next) ? router.query.next[0] : router.query.next || '/dashboard'
      router.push(next)
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Credenciais invalidas.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <aside className={styles.aside}>
          <span className={styles.eyebrow}>Acesso seguro</span>
          <h1>Entre para revisar saldo, lancamentos e sinais do seu fluxo financeiro.</h1>
          <p>
            A interface foi reorganizada em cards leves, filtros curtos e leituras mais claras para a rotina diaria.
          </p>

          <div className={styles.asideCards}>
            <article>
              <strong>Resumo rapido</strong>
              <span>KPIs, categorias e historico recente no mesmo painel.</span>
            </article>
            <article>
              <strong>Fluxo continuo</strong>
              <span>Cookies HttpOnly e sessao integrada ao backend.</span>
            </article>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.formIntro}>
            <Link href="/" className={styles.brand}>Bankio</Link>
            <h2>Entrar</h2>
            <p>Continue de onde voce parou e acompanhe o que mudou desde a ultima revisao.</p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <label>
            <span>E-mail</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="voce@empresa.com" />
          </label>

          <label>
            <span>Senha</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" minLength={8} placeholder="Minimo de 8 caracteres" />
          </label>

          <Button type="submit" disabled={loading} size="lg" fullWidth>
            {loading ? 'Entrando...' : 'Entrar na conta'}
          </Button>

          <p className={styles.footnote}>Ainda nao possui conta? <Link href="/register">Crie uma agora</Link></p>
        </form>
      </section>
    </div>
  )
}
