"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTransactionAction } from "@/app/actions/transactions";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState, Category, Transaction } from "@/types";
import { formatDateInput } from "@/lib/formatters";

const INITIAL_STATE: ActionState = { ok: true };

interface Props {
  categories: (Category & { label: string })[];
  transaction?: Transaction;
  action?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export function TransactionForm({
  categories,
  transaction,
  action: customAction,
}: Props) {
  const serverAction = customAction ?? createTransactionAction;
  const [state, action, pending] = useActionState(serverAction, INITIAL_STATE);

  return (
    <article className="surface form-card">
      <div className="page-heading">
        <span className="eyebrow">
          {transaction ? "Editar lançamento" : "Novo lançamento"}
        </span>
        <h2 className="section-title">
          {transaction ? "Atualizar movimentação" : "Cadastrar movimentação"}
        </h2>
      </div>

      {!categories.length && (
        <div className="empty-state" style={{ marginBottom: "1rem" }}>
          <h3>Nenhuma categoria ativa</h3>
          <p>
            Crie uma categoria ativa antes de registrar novos lançamentos.
          </p>
          <Link className="btn btn--primary" href="/categorias">
            Ir para categorias
          </Link>
        </div>
      )}

      <ErrorBanner errors={state.errors || {}} />

      <form className="form-grid" action={action}>
        <label className="field">
          <span>Categoria</span>
          <select
            name="category"
            required
            disabled={pending || !categories.length}
          >
            <option value="">Selecione</option>
            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
                selected={
                  transaction
                    ? String(transaction.category) === String(c.id)
                    : false
                }
              >
                {c.label}
              </option>
            ))}
          </select>
          <FieldErrors errors={state.errors || {}} field="category" />
        </label>

        <div className="grid-2">
          <label className="field">
            <span>Tipo</span>
            <select name="type" required disabled={pending}>
              <option
                value="receita"
                selected={transaction?.type === "receita"}
              >
                Receita
              </option>
              <option
                value="despesa"
                selected={!transaction || transaction.type === "despesa"}
              >
                Despesa
              </option>
            </select>
            <FieldErrors errors={state.errors || {}} field="type" />
          </label>

          <label className="field">
            <span>Data</span>
            <input
              type="date"
              name="date"
              defaultValue={
                transaction ? formatDateInput(transaction.date) : ""
              }
              required
              disabled={pending}
            />
            <FieldErrors errors={state.errors || {}} field="date" />
          </label>
        </div>

        <label className="field">
          <span>Descrição</span>
          <input
            type="text"
            name="description"
            defaultValue={transaction?.description || ""}
            maxLength={255}
            required
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="description" />
        </label>

        <label className="field">
          <span>Valor</span>
          <input
            type="text"
            name="amount"
            defaultValue={transaction?.amount || ""}
            placeholder="0,00"
            required
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="amount" />
        </label>

        <label className="field">
          <span>Recorrente?</span>
          <select name="is_recurring" disabled={pending}>
            <option
              value="false"
              selected={!transaction || !transaction.is_recurring}
            >
              Não
            </option>
            <option value="true" selected={Boolean(transaction?.is_recurring)}>
              Sim
            </option>
          </select>
        </label>

        {transaction?.is_recurring && (
          <>
            <label className="field">
              <span>Frequência</span>
              <select name="frequency" disabled={pending}>
                <option value="">Selecione</option>
                {["diaria", "semanal", "quinzenal", "mensal", "anual"].map(
                  (f) => (
                    <option
                      key={f}
                      value={f}
                      selected={transaction.frequency === f}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  )
                )}
              </select>
              <FieldErrors errors={state.errors || {}} field="frequency" />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Data início</span>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={formatDateInput(transaction.start_date)}
                  disabled={pending}
                />
              </label>
              <label className="field">
                <span>Data fim</span>
                <input
                  type="date"
                  name="end_date"
                  defaultValue={formatDateInput(transaction.end_date)}
                  disabled={pending}
                />
              </label>
            </div>
          </>
        )}

        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar lançamento"}
        </button>
      </form>
    </article>
  );
}
