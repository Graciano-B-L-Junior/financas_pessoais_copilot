import Link from 'next/link'

export default function Landing() {
  return (
    <div>
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="auth-logo-circle" style={{ width: 32, height: 32, fontSize: 14 }}>F</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Finanças Pessoais</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-secondary btn-sm">Entrar</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Criar conta</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Controle suas finanças<br />de forma simples</h1>
        <p>
          Gerencie receitas, despesas, recorrências e acompanhe seu
          comportamento financeiro com gráficos e análises inteligentes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary" style={{ background: '#fff', color: '#1A3C2B' }}>
            Começar grátis
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff' }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Dashboard</h3>
          <p>Visão completa das suas finanças com gráficos de barras e pizza.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📁</div>
          <h3>Categorias</h3>
          <p>Organize seus lançamentos por categorias personalizadas.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔄</div>
          <h3>Recorrentes</h3>
          <p>Automatize lançamentos mensais, semanais ou diários.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Análise</h3>
          <p>Entenda seu comportamento financeiro nos últimos 90 dias.</p>
        </div>
      </section>
    </div>
  )
}
