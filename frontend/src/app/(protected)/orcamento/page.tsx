import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeList, normalizeItem, extractPagination } from "@/lib/normalizers";
import { formatCurrency, formatPercent, currentMonthInput } from "@/lib/formatters";
import { Flash } from "@/components/ui/Flash";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Pagination } from "@/components/ui/Pagination";
import {
  createBudgetAction,
  finalizeBudgetAction,
  deleteBudgetAction,
} from "@/app/actions/budgets";
import { BudgetForm } from "@/components/forms/BudgetForm";
import type { Budget, Category } from "@/types";

export const metadata: Metadata = { title: "Orcamento" };

interface SearchParams {
  month?: string;
  status?: string;
  selected?: string;
  page?: string;
}

const PAGE_SIZE = 10;

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;

  let page = 1;
  if (query.page) {
    const parsed = parseInt(query.page, 10);
    if (!isNaN(parsed) && parsed >= 1) page = parsed;
  }

  const listParams: Record<string, string | undefined> = {
    status: query.status || undefined,
    page: String(page),
    page_size: String(PAGE_SIZE),
  };

  const [budgetsRes, categoriesRes] = await Promise.all([
    api.budgets.list(listParams),
    api.categories.list({ is_active: "true", type: "despesa" }),
  ]);

  if ([401, 403].includes(budgetsRes.status)) redirect("/login");

  const flash = await consumeFlash();
  const budgets = normalizeList<Budget>(budgetsRes.data);
  const paginationMeta = extractPagination(budgetsRes.data);
  const totalCount = paginationMeta?.count ?? budgets.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const hasNext = paginationMeta?.next !== null && paginationMeta !== null;
  const hasPrevious = paginationMeta?.previous !== null && paginationMeta !== null;
  const categories = normalizeList<Category>(categoriesRes.data);

  const selectedId = query.selected
    ? Number(query.selected)
    : query.month
      ? (budgets.find((b) => b.month === query.month)?.id ?? budgets[0]?.id)
      : budgets[0]?.id;
  const selectedBudgetDetail = selectedId
    ? await api.budgets.retrieve(selectedId)
    : null;
  const selectedBudget =
    selectedBudgetDetail?.status === 200
      ? normalizeItem<Budget>(selectedBudgetDetail.data)
      : (budgets.find((b) => b.id === selectedId) ?? null);

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Orçamento</span>
          <h1>Planejamento mensal de gastos</h1>
          <p>
            Registre seu orçamento mensal, distribua por categorias e
            acompanhe o realizado em relação ao previsto.
          </p>
          <div className="chip">{budgets.length} orçamentos cadastrados</div>
        </div>

        <Flash flash={flash} />

        <form className="filters" method="get" action="/orcamento">
          <label className="field search-field search-field--narrow">
            <span>Mês</span>
            <input
              type="month"
              name="month"
              defaultValue={query.month || ""}
            />
          </label>
          <label className="field search-field search-field--narrow">
            <span>Status</span>
            <select name="status">
              <option value="">Todos</option>
              <option value="active" selected={query.status === "active"}>
                Ativo
              </option>
              <option value="inactive" selected={query.status === "inactive"}>
                Inativo
              </option>
              <option value="archived" selected={query.status === "archived"}>
                Arquivado
              </option>
            </select>
          </label>
          <button className="btn btn--primary" type="submit">
            Filtrar
          </button>
        </form>
      </section>

      {/* Resumo do orçamento selecionado */}
      <section className="surface chart-card" style={{ marginBottom: "2rem" }}>
        <div className="page-heading">
          <span className="eyebrow">Resumo</span>
          <h2 className="section-title">Orçamento selecionado</h2>
        </div>

        {selectedBudget ? (
          <>
            <section className="metric-grid" style={{ marginBottom: "1rem" }}>
              <article className="metric surface">
                <span className="stat-label">Orçado</span>
                <div className="metric-value metric-value--accent">
                  {formatCurrency(
                    selectedBudget.execution?.budgeted_total ||
                      selectedBudget.total_amount ||
                      0
                  )}
                </div>
              </article>
              <article className="metric surface">
                <span className="stat-label">Realizado</span>
                <div className="metric-value metric-value--negative">
                  {formatCurrency(
                    selectedBudget.execution?.actual_expenses || 0
                  )}
                </div>
              </article>
              <article className="metric surface">
                <span className="stat-label">Saldo</span>
                <div
                  className={`metric-value ${
                    Number(
                      selectedBudget.execution?.remaining_amount || 0
                    ) >= 0
                      ? "metric-value--positive"
                      : "metric-value--negative"
                  }`}
                >
                  {formatCurrency(
                    selectedBudget.execution?.remaining_amount || 0
                  )}
                </div>
              </article>
              <article className="metric surface">
                <span className="stat-label">Execução</span>
                <div className="metric-value">
                  {formatPercent(
                    selectedBudget.execution?.execution_percentage || 0
                  )}
                </div>
              </article>
            </section>

            {selectedBudget.execution?.categories?.length ? (
              <>
                <div style={{ position: "relative", height: "320px", width: "100%" }}>
                  <canvas id="budgetDetailChart" />
                </div>
                <script
                  id="budgetDetailData"
                  type="application/json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify(
                      selectedBudget.execution.categories
                    ),
                  }}
                />
              </>
            ) : (
              <div className="empty-state">
                <h3>Sem categorias no orçamento</h3>
                <p>
                  Inclua categorias para comparar o valor orçado com o
                  realizado.
                </p>
              </div>
            )}

            {selectedBudget.execution?.alerts?.length ? (
              <div className="list-grid" style={{ marginTop: "1rem" }}>
                {selectedBudget.execution.alerts.map((alert, i) => (
                  <div key={i} className="list-item">
                    <div className="list-item__title">
                      <strong>{alert.message}</strong>
                      <span
                        className={`badge ${
                          alert.type === "exceeded"
                            ? "badge--danger"
                            : alert.type === "warning"
                              ? "badge--warning"
                              : "badge--success"
                        }`}
                      >
                        {alert.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <h3>Selecione um orçamento</h3>
            <p>
              Após criar um orçamento, escolha um registro da lista para
              acompanhar o realizado.
            </p>
          </div>
        )}
      </section>

      {/* Formulário de novo orçamento */}
      <BudgetForm categories={categories} />

      {/* Lista de orçamentos */}
      {budgets.length > 0 && (
        <section className="surface table-card">
          <div className="page-heading">
            <span className="eyebrow">Lista</span>
            <h2 className="section-title">Orçamentos cadastrados</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Total orçado</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id}>
                    <td>{b.month}</td>
                    <td>{formatCurrency(b.total_amount)}</td>
                    <td>
                      <span
                        className={`badge ${
                          b.status === "active"
                            ? "badge--success"
                            : b.status === "archived"
                              ? "badge--primary"
                              : "badge--warning"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <a
                          className="btn btn--ghost"
                          href={`/orcamento?selected=${b.id}`}
                        >
                          Ver
                        </a>
                        {b.status === "active" && (
                          <FinalizeBudgetForm id={b.id} />
                        )}
                        <DeleteBudgetForm id={b.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          pathname="/orcamento"
          searchParams={{
            month: query.month,
            status: query.status,
          }}
        />
      )}
    </main>
  );
}

function FinalizeBudgetForm({ id }: { id: number }) {
  const action = finalizeBudgetAction.bind(null, id);
  return (
    <form action={action}>
      <button className="btn btn--soft" type="submit">
        Finalizar
      </button>
    </form>
  );
}

function DeleteBudgetForm({ id }: { id: number }) {
  const action = deleteBudgetAction.bind(null, id);
  return (
    <form action={action}>
      <button
        className="btn btn--danger"
        type="submit"
        data-confirm="Remover este orçamento?"
      >
        Excluir
      </button>
    </form>
  );
}
