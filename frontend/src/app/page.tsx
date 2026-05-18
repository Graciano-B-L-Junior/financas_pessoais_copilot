import Link from "next/link";
import { cookies } from "next/headers";
import { NavPublic } from "@/components/layout/NavPublic";
import { Footer } from "@/components/layout/Footer";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(cookieStore.get("access_token")?.value);

  return (
    <>
      <body className="page--public">
        <NavPublic isAuthenticated={isAuthenticated} />

        <main className="container page-shell">
          <section className="hero surface">
            <div className="hero-copy">
              <span className="eyebrow">Módulo completo</span>
              <h1>
                Finanças pessoais com leitura clara, segura e pronta para uso.
              </h1>
              <p>
                Controle financeiro com dashboard, lançamentos e análises em um
                único lugar.
              </p>

              <div className="hero-actions">
                <Link className="btn btn--primary" href="/register">
                  Criar conta
                </Link>
                <Link className="btn btn--ghost" href="/login">
                  Entrar
                </Link>
              </div>

              <div className="callout" style={{ marginTop: "1.5rem" }}>
                <strong>Fluxo completo integrado</strong>
                <span className="muted">
                  Categorias, lançamentos, dashboard, perfil e análises
                  conectados ao backend Django.
                </span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-preview">
                <div className="hero-preview__grid">
                  <div className="hero-preview__mini">
                    <strong>Saldo mensal</strong>
                    <span>+ R$ 1.840,00</span>
                  </div>
                  <div className="hero-preview__mini">
                    <strong>Lançamentos recorrentes</strong>
                    <span>04</span>
                  </div>
                  <div className="hero-preview__mini">
                    <strong>Categorias ativas</strong>
                    <span>12</span>
                  </div>
                  <div className="hero-preview__mini">
                    <strong>Alertas de perfil</strong>
                    <span>02</span>
                  </div>
                </div>
              </div>

              <div className="list-grid">
                <div className="list-item">
                  <div className="list-item__title">
                    <strong>Dashboard orientado a decisão</strong>
                    <span className="badge badge--primary">RF001</span>
                  </div>
                  <p>
                    Resumo, filtros e indicadores para acompanhar receitas e
                    despesas sem ruído visual.
                  </p>
                </div>
                <div className="list-item">
                  <div className="list-item__title">
                    <strong>Operação guiada por formulário</strong>
                    <span className="badge badge--success">RF002</span>
                  </div>
                  <p>
                    CRUD de categorias e lançamentos com validação no backend e
                    UX de erro mais clara.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="section" style={{ marginTop: "1rem" }}>
            <div className="page-heading">
              <span className="eyebrow">O que você ganha</span>
              <h2 className="section-title">
                Uma superfície única para operar o produto inteiro.
              </h2>
              <p className="section-lead">
                O front conversa com a API sem expor os tokens ao navegador e
                organiza o fluxo por páginas simples de manter.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature surface">
                <span className="feature-badge">Autenticação</span>
                <h3>Login e cadastro sem fricção</h3>
                <p>
                  Fluxo com cookies HttpOnly, mensagens de erro objetivas e
                  transição direta para o painel.
                </p>
              </article>
              <article className="feature surface">
                <span className="feature-badge">Movimentações</span>
                <h3>Lançamentos e recorrências</h3>
                <p>
                  Formulário dedicado para receitas, despesas e lançamentos
                  recorrentes com filtros por período.
                </p>
              </article>
              <article className="feature surface">
                <span className="feature-badge">Insights</span>
                <h3>Resumo e análises</h3>
                <p>
                  Visualizações consolidadas com top categorias, saldo,
                  proporção de despesas e alertas de comportamento.
                </p>
              </article>
            </div>
          </section>
        </main>

        <Footer />
      </body>
    </>
  );
}
