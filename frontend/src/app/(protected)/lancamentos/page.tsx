import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeList, extractPagination } from "@/lib/normalizers";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Flash } from "@/components/ui/Flash";
import { Pagination } from "@/components/ui/Pagination";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { deleteTransactionAction } from "@/app/actions/transactions";
import type { Category, Transaction } from "@/types";

export const metadata: Metadata = { title: "Lançamentos" };

interface SearchParams {
  start?: string;
  end?: string;
  category?: string;
  type?: string;
  is_recurring?: string;
  page?: string;
}

const PAGE_SIZE = 20;

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  
  // Validar página: deve ser >= 1
  let page = 1;
  if (query.page) {
    const parsed = parseInt(query.page, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed;
    } else if (query.page && !isNaN(parseInt(query.page, 10))) {
      // Se a página é inválida (< 1), redirecionar para página 1 mantendo outros filtros
      const params = new URLSearchParams();
      if (query.start) params.set("start", query.start);
      if (query.end) params.set("end", query.end);
      if (query.category) params.set("category", query.category);
      if (query.type) params.set("type", query.type);
      if (query.is_recurring) params.set("is_recurring", query.is_recurring);
      redirect(`/lancamentos${params.toString() ? "?" + params.toString() : ""}`);
    }
  }

  const params: Record<string, string | undefined> = {
    start: query.start || undefined,
    end: query.end || undefined,
    category: query.category || undefined,
    type: query.type || undefined,
    is_recurring: query.is_recurring || undefined,
    page: String(page),
  };

  const [transactionsRes, categoriesRes] =
    await Promise.all([
      api.transactions.list(params),
      api.categories.list({}),
    ]);

  if ([401, 403].includes(transactionsRes.status)) redirect("/login");

  const flash = await consumeFlash();
  const transactions = normalizeList<Transaction>(transactionsRes.data);
  const paginationMeta = extractPagination(transactionsRes.data);
  
  // Calcular metadata de paginação
  const totalCount = paginationMeta?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const hasNext = paginationMeta?.next !== null;
  const hasPrevious = paginationMeta?.previous !== null;

  const allCategories = normalizeList<Category>(categoriesRes.data).map(
    (c) => ({ ...c, label: c.is_active ? c.name : `${c.name} (inativa)` })
  );
  const activeCategories = normalizeList<Category>(categoriesRes.data)
    .filter((c) => c.is_active)
    .map((c) => ({ ...c, label: c.name }));

  // Preservar query params para Pagination component
  const paginationSearchParams: Record<string, string | undefined> = {
    start: query.start,
    end: query.end,
    category: query.category,
    type: query.type,
    is_recurring: query.is_recurring,
  };

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
            <span className="eyebrow">Lançamentos</span>
            <h1>Movimentações financeiras</h1>
            <p>
              Registre receitas, despesas e recorrências com filtros de período e
              categoria.
            </p>
          <div className="chip">
            {totalCount} {totalCount === 1 ? "registro" : "registros"} •{" "}
            {totalPages > 1 && `Página ${page} de ${totalPages}`}
          </div>
          <div className="grid-3">
            <Link
              href="/lancamentos/importar"
              className="btn btn--primary text-sm"
            >
              Importar Planilha
            </Link>
            <a
              href={`/api/export?year=${new Date().getFullYear()}`}
              className="btn btn--secondary text-sm"
            >
              Exportar
            </a>
          </div>
        </div>

        <Flash flash={flash} />

        <form className="filters" method="get" action="/lancamentos">
          <label className="field search-field search-field--narrow">
            <span>Início</span>
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
              {allCategories.map((c) => (
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
                Não
              </option>
            </select>
          </label>
          <button className="btn btn--primary" type="submit">
            Filtrar
          </button>
        </form>
      </section>

      <section className="grid-2">
        <TransactionForm categories={activeCategories} />

        <article className="surface table-card">
          <div className="page-heading">
            <span className="eyebrow">Lista</span>
            <h2 className="section-title">Movimentações cadastradas</h2>
          </div>

          {transactions.length ? (
            <>
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  pathname="/lancamentos"
                  searchParams={paginationSearchParams}
                />
              )}

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Recorrente</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDate(t.date)}</td>
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
                        <td>{t.is_recurring ? "Sim" : "Não"}</td>
                        <td>
                          <div className="table-actions">
                            <Link
                              className="btn btn--ghost"
                              href={`/lancamentos/${t.id}`}
                            >
                              Editar
                            </Link>
                            <DeleteTransactionForm id={t.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  pathname="/lancamentos"
                  searchParams={paginationSearchParams}
                />
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Nenhum lançamento encontrado</h3>
              <p>Adicione seu primeiro lançamento financeiro.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function DeleteTransactionForm({ id }: { id: number }) {
  const action = deleteTransactionAction.bind(null, id);
  return (
    <form action={action}>
      <button
        className="btn btn--danger"
        type="submit"
        data-confirm="Remover este lançamento?"
      >
        Excluir
      </button>
    </form>
  );
}
