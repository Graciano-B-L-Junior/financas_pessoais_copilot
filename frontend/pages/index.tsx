import Link from 'next/link'

export default function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <h1>Finanças Pessoais</h1>
        <p>
          Controle suas receitas e despesas, acompanhe categorias, recorrentes e tenha
          um dashboard completo com análise do seu comportamento financeiro.
        </p>
        <div className="cta-group">
          <Link href="/register" className="btn btn-primary" style={{ background: '#4CAF7A' }}>
            Criar conta grátis
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#fff', background: 'transparent' }}>
            Entrar
          </Link>
        </div>
      </section>

      <section className="landing-features">
        {[
          { icon: '📊', title: 'Dashboard', desc: 'Visualize receitas e despesas por período, categoria e tendência mensal.' },
          { icon: '🏷️', title: 'Categorias', desc: 'Organize seus lançamentos com categorias personalizadas.' },
          { icon: '🔁', title: 'Recorrentes', desc: 'Cadastre despesas e receitas que se repetem automaticamente.' },
          { icon: '📈', title: 'Análise', desc: 'Entenda seu comportamento financeiro com relatórios inteligentes.' },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
