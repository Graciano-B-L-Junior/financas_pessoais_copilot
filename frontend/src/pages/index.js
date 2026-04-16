import Link from 'next/link'
import styles from '../styles/Landing.module.css'

export default function LandingPage() {
  const features = [
    {
      title: 'Painel limpo',
      description: 'Saldo, categorias e lancamentos em blocos claros e faceis de escanear.',
    },
    {
      title: 'Rotina simples',
      description: 'Cadastre receitas e despesas sem excesso de passos ou distracoes visuais.',
    },
    {
      title: 'Consistencia total',
      description: 'A entrada do produto segue o mesmo padrao visual da area logada.',
    },
  ]

  const previewTransactions = [
    { name: 'Mercado', date: 'Hoje', amount: '-R$ 128,00' },
    { name: 'Salario', date: 'Ontem', amount: '+R$ 4.800,00' },
    { name: 'Streaming', date: '14 abr', amount: '-R$ 39,90' },
  ]

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>◌</span>
          <span>Bankio</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="#beneficios">Beneficios</Link>
          <Link href="/login">Entrar</Link>
          <Link href="/register" className={styles.btnPrimary}>Criar conta</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Clareza financeira diaria</span>
          <h1>Controle suas financas com uma interface simples e consistente.</h1>
          <p>
            A landing agora resume o produto sem exageros: visual leve, hierarquia clara e uma amostra fiel da experiencia principal.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.btnPrimary}>Comecar agora</Link>
            <Link href="/login" className={styles.btnSecondary}>Entrar</Link>
          </div>

          <div className={styles.metrics}>
            <div>
              <strong>Saldo</strong>
              <span>acompanhe entradas e saidas com leitura imediata</span>
            </div>
            <div>
              <strong>Categorias</strong>
              <span>organize despesas e receitas com consistencia</span>
            </div>
            <div>
              <strong>Perfil</strong>
              <span>mantenha locale e moeda alinhados ao seu uso</span>
            </div>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <article className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <span>Saldo total</span>
              <span className={styles.badge}>Hoje</span>
            </div>
            <strong>R$ 31.180,24</strong>
            <p>Resumo rapido para entender o momento financeiro antes de entrar no painel.</p>
          </article>

          <article className={styles.transactionPanel}>
            <div className={styles.transactionHeader}>
              <h2>Ultimos lancamentos</h2>
              <span>3 itens</span>
            </div>
            <div className={styles.transactionPreview}>
              {previewTransactions.map((transaction) => (
                <div key={transaction.name} className={styles.transactionRow}>
                  <span className={styles.transactionAvatar}>○</span>
                  <div>
                    <strong>{transaction.name}</strong>
                    <span>{transaction.date}</span>
                  </div>
                  <b>{transaction.amount}</b>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.features} id="beneficios">
        {features.map((feature, index) => (
          <article key={feature.title} className={styles.featureCard}>
            <span className={styles.featureIcon}>{String(index + 1).padStart(2, '0')}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
