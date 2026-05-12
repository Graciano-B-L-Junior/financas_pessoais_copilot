import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeList } from "@/lib/normalizers";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Flash } from "@/components/ui/Flash";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { deleteTransactionAction } from "@/app/actions/transactions";
import type { Category, Transaction } from "@/types";

export const metadata: Metadata = { title: "Lancamentos" };

interface SearchParams {
  start?: string;
  end?: string;
  category?: string;
  type?: string;
  is_recurring?: string;
}

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const params: Record<string, string | undefined> = {
    start: query.start || undefined,
    end: query.end || undefined,
    category: query.category || undefined,
    type: query.type || undefined,
    is_recurring: query.is_recurring || undefined,
  };

  const [transactionsRes, allCategoriesRes, activeCategoriesRes] =
    await Promise.all([
      api.transactions.list(params),
      api.categories.list({}),
      api.categories.list({ is_active: "true" }),
    ]);

  if ([401, 403].includes(transactionsRes.status)) redirect("/login");

  const flash = await consumeFlash();
  const transactions = normalizeList<Transaction>(transactionsRes.data);
  const allCategories = normalizeList<Category>(allCategoriesRes.data).map(
    (c) => ({ ...c, label: c.is_active ? c.name : `${c.name} (inativa)` })
  );
  const activeCategories = normalizeList<Category>(activeCategoriesRes.data).map(
    (c) => ({ ...c, label: c.name })
  );

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Lancamentos</span>
          <h1>Movimentacoes financeiras</h1>
          <p>
            Registre receitas, despesas e recorrencias com filtros de periodo e
            categoria.
          </p>
          <div className="chip">{transactions.length} registros</div>
        </div>

        <Flash flash={flash} />

        <form className="filters" method="get" action="/lancamentos">
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
                Nao
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
            <h2 className="section-title">Movimentacoes cadastradas</h2>
          </div>

          {transactions.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descricao</th>
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
                      <td>{t.is_recurring ? "Sim" : "Nao"}</td>
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
          ) : (
            <div className="empty-state">
              <h3>Nenhum lancamento encontrado</h3>
              <p>Adicione seu primeiro lancamento financeiro.</p>
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
        data-confirm="Remover este lancamento?"
      >
        Excluir
      </button>
    </form>
  );
}
