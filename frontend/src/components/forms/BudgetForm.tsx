"use client";

import { useActionState } from "react";
import { createBudgetAction as _createBudgetAction } from "@/app/actions/budgets";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState, Category } from "@/types";
import { currentMonthInput } from "@/lib/formatters";

const INITIAL_STATE: ActionState = { ok: true };

export function BudgetForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(
    _createBudgetAction,
    INITIAL_STATE
  );

  return (
    <article className="surface form-card" style={{ marginBottom: "2rem" }}>
      <div className="page-heading">
        <span className="eyebrow">Novo orçamento</span>
        <h2 className="section-title">Cadastrar orçamento mensal</h2>
      </div>

      <ErrorBanner errors={state.errors || {}} />

      <form className="form-grid" action={action}>
        <label className="field">
          <span>Mês</span>
          <input
            type="month"
            name="month"
            defaultValue={currentMonthInput()}
            required
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="month" />
        </label>

        {categories.length ? (
          <>
            <p className="helper-text">
              Distribua o orçamento por categoria de despesa:
            </p>
            {categories.map((c, i) => (
              <div key={c.id} className="grid-2">
                <input type="hidden" name={`categories[${i}][category_id]`} value={c.id} />
                <label className="field">
                  <span>{c.name}</span>
                  <input
                    type="text"
                    name={`categories[${i}][budgeted_amount]`}
                    placeholder="0,00"
                    disabled={pending}
                  />
                </label>
              </div>
            ))}
          </>
        ) : (
          <div className="empty-state">
            <h3>Nenhuma categoria de despesa ativa</h3>
            <p>
              Crie categorias de despesa ativas para distribuir o orçamento.
            </p>
          </div>
        )}

        <button
          className="btn btn--primary"
          type="submit"
          disabled={pending || !categories.length}
        >
          {pending ? "Salvando..." : "Salvar orçamento"}
        </button>
      </form>
    </article>
  );
}
