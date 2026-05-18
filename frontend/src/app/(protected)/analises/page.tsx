import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeItem } from "@/lib/normalizers";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Analytics } from "@/types";

export const metadata: Metadata = { title: "Análises" };

interface SearchParams {
  start?: string;
  end?: string;
}

export default async function AnalisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const params: Record<string, string | undefined> = {
    start: query.start || undefined,
    end: query.end || undefined,
  };

  const response = await api.analytics.get(params);
  if ([401, 403].includes(response.status)) redirect("/login");

  const analytics = normalizeItem<Analytics>(response.data);

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Análises</span>
          <h1>Insights do perfil financeiro</h1>
          <p>
            Resumo analítico com proporções, top categorias e sugestões
            orientadas pelo comportamento do usuário.
          </p>
        </div>

        <form className="filters" method="get" action="/analises">
          <label className="field search-field search-field--narrow">
            <span>Início</span>
            <input type="date" name="start" defaultValue={query.start || ""} />
          </label>
          <label className="field search-field search-field--narrow">
            <span>Fim</span>
            <input type="date" name="end" defaultValue={query.end || ""} />
          </label>
          <button className="btn btn--primary" type="submit">
            Atualizar análise
          </button>
        </form>
      </section>

      <section className="analises-metric-grid">
        <article className="metric surface">
          <span className="stat-label">Receitas</span>
          <div className="metric-value metric-value--accent">
            {formatCurrency(analytics.summary?.income_total || 0)}
          </div>
        </article>
        <article className="metric surface">
          <span className="stat-label">Despesas</span>
          <div className="metric-value metric-value--negative">
            {formatCurrency(analytics.summary?.expense_total || 0)}
          </div>
        </article>
        <article className="metric surface">
          <span className="stat-label">Saldo</span>
          <div
            className={`metric-value ${
              Number(analytics.summary?.balance || 0) >= 0
                ? "metric-value--positive"
                : "metric-value--negative"
            }`}
          >
            {formatCurrency(analytics.summary?.balance || 0)}
          </div>
        </article>
        <article className="metric surface">
          <span className="stat-label">Despesa sobre receita</span>
          <div className="metric-value">
            {formatPercent(analytics.summary?.expense_ratio || 0)}
          </div>
        </article>
        <article className="metric surface">
          <span className="stat-label">Receita base</span>
          <div className="metric-value">
            {formatPercent(analytics.summary?.income_ratio || 0)}
          </div>
        </article>
      </section>

      <section className="grid-2">
        <article className="surface list-card">
          <div className="page-heading">
            <span className="eyebrow">Top categorias</span>
            <h2 className="section-title">Onde o dinheiro se concentrou</h2>
          </div>

          {analytics.top_categories?.length ? (
            <div className="list-grid">
              {analytics.top_categories.map((item, i) => (
                <div key={i} className="list-item">
                  <div className="list-item__title">
                    <strong>{item.category}</strong>
                    <span className="badge badge--primary">
                      {formatCurrency(item.total || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nenhuma categoria no período</h3>
              <p>
                Amplie o intervalo para visualizar a distribuição analítica.
              </p>
            </div>
          )}
        </article>

        <article className="surface list-card">
          <div className="page-heading">
            <span className="eyebrow">Insights</span>
            <h2 className="section-title">Leituras e recomendacoes</h2>
          </div>

          {analytics.insights?.length ? (
            <div className="list-grid">
              {analytics.insights.map((insight, i) => (
                <div
                  key={i}
                  className="insight surface"
                  style={{ background: "rgba(255,255,255,0.86)" }}
                >
                  <div className="list-item__title">
                    <strong>{insight.title}</strong>
                    <span
                      className={`badge ${
                        insight.severity === "high"
                          ? "badge--danger"
                          : insight.severity === "medium"
                            ? "badge--warning"
                            : "badge--success"
                      }`}
                    >
                      {insight.code}
                    </span>
                  </div>
                  <p>{insight.description}</p>
                  <div className="callout" style={{ marginTop: "0.75rem" }}>
                    <strong>Sugestao</strong>
                    <span>{insight.suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Sem insights no período</h3>
              <p>
                O sistema vai gerar recomendacoes assim que houver dados
                suficientes.
              </p>
            </div>
          )}
        </article>
      </section>


    </main>
  );
}
