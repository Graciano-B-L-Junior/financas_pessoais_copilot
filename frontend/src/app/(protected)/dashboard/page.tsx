import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeItem, normalizeList } from "@/lib/normalizers";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Flash } from "@/components/ui/Flash";
import type { Dashboard, Category, Transaction } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

interface SearchParams {
  start?: string;
  end?: string;
  category?: string;
  type?: string;
  is_recurring?: string;
  min_amount?: string;
  max_amount?: string;
}

function dashboardQuery(query: SearchParams) {
  const p: Record<string, string | undefined> = {};
  if (query.start) p.start = query.start;
  if (query.end) p.end = query.end;
  if (query.category) p.category = query.category;
  if (query.type) p.type = query.type;
  if (query.is_recurring) p.is_recurring = query.is_recurring;
  if (query.min_amount) p.min_amount = query.min_amount;
  if (query.max_amount) p.max_amount = query.max_amount;
  return p;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const params = dashboardQuery(query);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [dashboardRes, categoriesRes, transactionsRes] = await Promise.all([
    api.dashboard.get(params),
    api.categories.list({}),
    api.transactions.list(params),
  ]);

  if ([401, 403].includes(dashboardRes.status)) redirect("/login");

  const flash = await consumeFlash();
  const dashboard = normalizeItem<Dashboard>(dashboardRes.data);
  const categories = normalizeList<Category>(categoriesRes.data).map((c) => ({
    ...c,
    label: c.is_active ? c.name : `${c.name} (inativa)`,
  }));
  const expenseCategories = categories.filter((category) => category.type === "despesa");
  const recentTransactions = normalizeList<Transaction>(transactionsRes.data).slice(0, 6);

  const monthlySeries = dashboard.monthly_series || [];
  const topCategories = dashboard.top_categories || [];
  const budgetSeries = dashboard.budget_series || [];

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Dashboard</span>
          <h1>Seu resumo financeiro</h1>
          <p>
            Visao consolidada com filtros por periodo, categoria, tipo,
            recorrencia e faixa de valor.
          </p>
          <div className="chip">Atualizado a partir da API em tempo real</div>
        </div>

        <Flash flash={flash} />

        <form className="filters" method="get" action="/dashboard">
          <label className="field search-field search-field--narrow">
            <span>Inicio</span>
            <input type="date" name="start" defaultValue={query.start || ""} />
          </label>
          <label className="field search-field search-field--narrow">
            <span>Fim</span>
            <input type="date" name="end" defaultValue={query.end || ""} />
          </label>
          <label className="field search-field">
            <span>Categoria</span>
            <select name="category">
              <option value="">Todas</option>
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  selected={String(query.category || "") === String(c.id)}
                >
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field search-field search-field--narrow">
            <span>Tipo</span>
            <select name="type">
              <option value="">Todos</option>
              <option value="receita" selected={query.type === "receita"}>
                Receita
              </option>
              <option value="despesa" selected={query.type === "despesa"}>
                Despesa
              </option>
            </select>
          </label>
          <label className="field search-field search-field--narrow">
            <span>Recorrente</span>
            <select name="is_recurring">
              <option value="">Todos</option>
              <option value="true" selected={query.is_recurring === "true"}>
                Sim
              </option>
              <option value="false" selected={query.is_recurring === "false"}>
                Nao
              </option>
            </select>
          </label>
          <label className="field search-field search-field--narrow">
            <span>Valor minimo</span>
            <input
              type="text"
              id="minAmountInput"
              name="min_amount"
              defaultValue={query.min_amount || ""}
              placeholder="0,00"
            />
          </label>
          <label className="field search-field search-field--narrow">
            <span>Valor maximo</span>
            <input
              type="text"
              id="maxAmountInput"
              name="max_amount"
              defaultValue={query.max_amount || ""}
              placeholder="0,00"
            />
          </label>
          <button className="btn btn--primary" type="submit">
            Aplicar filtros
          </button>
        </form>
      </section>

      <section className="dashboard-metric-grid">
        <article className="metric surface">
          <span className="stat-label">Receitas</span>
          <div className="metric-value metric-value--accent">
            {formatCurrency(dashboard.summary?.total_income || 0)}
          </div>
          <p className="metric-desc">Total do periodo filtrado.</p>
        </article>
        <article className="metric surface">
          <span className="stat-label">Despesas</span>
          <div className="metric-value metric-value--negative">
            {formatCurrency(dashboard.summary?.total_expenses || 0)}
          </div>
          <p className="metric-desc">Saidas consolidadas do periodo.</p>
        </article>
        <article className="metric surface">
          <span className="stat-label">Saldo</span>
          <div
            className={`metric-value ${
              Number(dashboard.summary?.balance || 0) >= 0
                ? "metric-value--positive"
                : "metric-value--negative"
            }`}
          >
            {formatCurrency(dashboard.summary?.balance || 0)}
          </div>
          <p className="metric-desc">Resultado entre entradas e saidas.</p>
        </article>
        <article className="metric surface">
          <span className="stat-label">Lancamentos</span>
          <div className="metric-value">
            {dashboard.summary?.transaction_count || 0}
          </div>
          <p className="metric-desc">Quantidade de registros filtrados.</p>
        </article>
        <article className="metric surface">
          <span className="stat-label">Recorrentes</span>
          <div className="metric-value">
            {dashboard.summary?.recurring_count || 0}
          </div>
          <p className="metric-desc">Itens com recorrencia ativa.</p>
        </article>
        <article className="metric surface">
          <span className="stat-label">Orcamento</span>
          <div className="metric-value metric-value--accent">
            {formatPercent(dashboard.budget_summary?.execution_percentage || 0)}
          </div>
          <p className="metric-desc">Execução do orçamento ativo.</p>
        </article>
      </section>

      {/* Gráficos — renderiza os dados como JSON para o Chart.js do app.js */}
      <section className="charts-section">
        <article className="surface chart-card">
          <div className="page-heading">
            <span className="eyebrow">Evolução</span>
            <h2 className="section-title">Receitas vs Despesas por mês</h2>
          </div>
          {monthlySeries.length > 0 ? (
            <>
              <div style={{ position: "relative", height: "320px", width: "100%" }}>
                <canvas id="monthlyChart" />
              </div>
              <script
                id="monthlySeriesData"
                type="application/json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(monthlySeries),
                }}
              />
            </>
          ) : (
            <div className="empty-state">
              <h3>Sem dados para o período</h3>
              <p>Amplie o período de filtro para visualizar a evolução mensal.</p>
            </div>
          )}
        </article>

        <article className="surface chart-card">
          <div className="page-heading">
            <span className="eyebrow">Orçamento</span>
            <h2 className="section-title">Orçado vs realizado</h2>
          </div>
          {budgetSeries.length > 0 ? (
            <>
              <div style={{ position: "relative", height: "320px", width: "100%" }}>
                <canvas id="budgetChart" />
              </div>
              <script
                id="budgetSeriesData"
                type="application/json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(budgetSeries),
                }}
              />
            </>
          ) : (
            <div className="empty-state">
              <h3>Sem orçamento cadastrado</h3>
              <p>
                Crie um orçamento para acompanhar a evolução entre o valor
                previsto e o realizado.
              </p>
            </div>
          )}
        </article>

        <article className="surface chart-card">
          <div className="page-heading">
            <span className="eyebrow">Distribuição</span>
            <h2 className="section-title">Top categorias</h2>
          </div>
          {topCategories.length > 0 ? (
            <>
              <div style={{ position: "relative", height: "320px", width: "100%" }}>
                <canvas id="categoriesChart" />
              </div>
              <script
                id="topCategoriesData"
                type="application/json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(topCategories),
                }}
              />
            </>
          ) : (
            <div className="empty-state">
              <h3>Sem categorias no periodo</h3>
              <p>
                Adicione lancamentos ou amplie o filtro para visualizar a
                distribuicao.
              </p>
            </div>
          )}
        </article>

        <article className="surface chart-card chart-card--wide">
          <div className="page-heading">
            <span className="eyebrow">Detalhado</span>
            <h2 className="section-title">Evolução por categoria</h2>
          </div>
          <div className="filters" style={{ marginBottom: "var(--spacing-md, 1rem)" }}>
            <label className="field search-field search-field--narrow">
              <span>Granularidade</span>
              <select id="categoryEvolutionGranularity" name="category-evolution-granularity">
                <option value="monthly">Mensal</option>
                <option value="daily">Diária</option>
              </select>
            </label>
            <label
              className="field search-field search-field--narrow"
              id="categoryEvolutionMonthField"
              style={{ display: "none" }}
            >
              <span>Mês</span>
              <select
                id="categoryEvolutionMonth"
                name="category-evolution-month"
                disabled
              >
                <option value="">-- selecione um mês --</option>
              </select>
            </label>
            <label className="field search-field">
              <span>Selecione uma categoria de despesa</span>
              <select id="categoryFilterSelect" name="category-evolution-filter">
                <option value="">
                  Escolha uma categoria para ver a evolução
                </option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div id="categoryEvolutionContainer" style={{ display: "none" }} />
        </article>
      </section>

      {recentTransactions.length > 0 && (
        <section className="surface panel">
          <div className="page-heading">
            <span className="eyebrow">Recentes</span>
            <h2 className="section-title">Ultimos lancamentos</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>
                      <span
                        className={`badge ${
                          t.type === "receita"
                            ? "badge--success"
                            : "badge--danger"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td>{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
