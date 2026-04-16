import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { register } from '../lib/auth'
import Button from '../components/Button'
import { formatApiError } from '../lib/formatters'
import styles from '../styles/Auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', name: '', password: '', date_of_birth: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register(form)
      router.push('/dashboard')
    } catch (err) {
      setError(formatApiError(err.response?.data, 'Erro ao criar conta.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <aside className={`${styles.aside} ${styles.asideSoft}`}>
          <span className={styles.eyebrow}>Nova rotina</span>
          <h1>Crie a conta e comece com um painel desenhado para leitura rapida e calma.</h1>
          <p>
            A organizacao por cards, tons suaves e hierarquia clara ajuda a registrar o essencial sem sobrecarregar a tela.
          </p>

          <div className={styles.asideCards}>
            <article>
              <strong>Config inicial</strong>
              <span>Nome, data de nascimento, locale e moeda ajustados no seu ritmo.</span>
            </article>
            <article>
              <strong>Depois da conta</strong>
              <span>Cadastre categorias, lancamentos e recorrencias direto no fluxo principal.</span>
            </article>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.formIntro}>
            <Link href="/" className={styles.brand}>Bankio</Link>
            <h2>Criar conta</h2>
            <p>Configure sua base de uso agora e refine os detalhes de perfil depois no painel.</p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formGrid}>
            <label>
              <span>Nome</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Seu nome" />
            </label>

            <label>
              <span>Data de nascimento</span>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
            </label>
          </div>

          <label>
            <span>E-mail</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="voce@empresa.com" />
          </label>

          <label>
            <span>Senha</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} autoComplete="new-password" placeholder="Minimo de 8 caracteres" />
          </label>

          <Button type="submit" disabled={loading} size="lg" fullWidth>
            {loading ? 'Criando...' : 'Criar minha conta'}
          </Button>

          <p className={styles.footnote}>Ja possui conta? <Link href="/login">Entrar</Link></p>
        </form>
      </section>
    </div>
  )
}
