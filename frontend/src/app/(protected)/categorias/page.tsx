import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeList } from "@/lib/normalizers";
import { Flash } from "@/components/ui/Flash";
import { CategoryForm } from "@/components/forms/CategoryForm";
import {
  toggleCategoryStatusAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Categorias" };

interface SearchParams {
  type?: string;
  is_active?: string;
}

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const params: Record<string, string | undefined> = {
    type: query.type || undefined,
    is_active: query.is_active || undefined,
  };

  const response = await api.categories.list(params);
  if ([401, 403].includes(response.status)) redirect("/login");

  const flash = await consumeFlash();
  const categories = normalizeList<Category>(response.data);

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Categorias</span>
          <h1>Gestao de categorias</h1>
          <p>
            Crie categorias para receitas e despesas, filtre por tipo e altere o
            status sem perder o historico.
          </p>
          <div className="chip">{categories.length} registros</div>
        </div>

        <Flash flash={flash} />

        <form className="filters" method="get" action="/categorias">
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
            <span>Status</span>
            <select name="is_active">
              <option value="">Todos</option>
              <option value="true" selected={query.is_active === "true"}>
                Ativas
              </option>
              <option value="false" selected={query.is_active === "false"}>
                Inativas
              </option>
            </select>
          </label>
          <button className="btn btn--primary" type="submit">
            Filtrar
          </button>
        </form>
      </section>

      <section className="grid-2">
        <CategoryForm />

        <article className="surface table-card">
          <div className="page-heading">
            <span className="eyebrow">Lista</span>
            <h2 className="section-title">Categorias cadastradas</h2>
          </div>

          {categories.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            category.type === "receita"
                              ? "badge--success"
                              : "badge--danger"
                          }`}
                        >
                          {category.type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            category.is_active
                              ? "badge--success"
                              : "badge--warning"
                          }`}
                        >
                          {category.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>{category.description || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="btn btn--ghost"
                            href={`/categorias/${category.id}`}
                          >
                            Editar
                          </Link>
                          <ToggleStatusForm category={category} />
                          <DeleteCategoryForm id={category.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nenhuma categoria encontrada</h3>
              <p>
                Cadastre sua primeira categoria para organizar receitas e
                despesas.
              </p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function ToggleStatusForm({ category }: { category: Category }) {
  const action = toggleCategoryStatusAction.bind(null, category.id, !category.is_active);
  return (
    <form action={action}>
      <button
        className={`btn ${category.is_active ? "btn--soft" : "btn--primary"}`}
        type="submit"
      >
        {category.is_active ? "Desativar" : "Ativar"}
      </button>
    </form>
  );
}

function DeleteCategoryForm({ id }: { id: number }) {
  const action = deleteCategoryAction.bind(null, id);
  return (
    <form action={action}>
      <button
        className="btn btn--danger"
        type="submit"
        data-confirm="Remover esta categoria?"
      >
        Excluir
      </button>
    </form>
  );
}
