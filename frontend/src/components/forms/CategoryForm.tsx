"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/app/actions/categories";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState, Category } from "@/types";

const INITIAL_STATE: ActionState = { ok: true };

interface Props {
  category?: Category;
  action?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export function CategoryForm({ category, action: customAction }: Props) {
  const serverAction = customAction ?? createCategoryAction;
  const [state, action, pending] = useActionState(serverAction, INITIAL_STATE);

  return (
    <article className="surface form-card">
      <div className="page-heading">
        <span className="eyebrow">
          {category ? "Editar categoria" : "Nova categoria"}
        </span>
        <h2 className="section-title">
          {category ? "Atualizar categoria" : "Cadastrar categoria"}
        </h2>
      </div>

      <ErrorBanner errors={state.errors || {}} />

      <form className="form-grid" action={action}>
        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            name="name"
            defaultValue={category?.name || ""}
            maxLength={120}
            required
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="name" />
        </label>

        <label className="field">
          <span>Tipo</span>
          <select name="type" required disabled={pending}>
            <option value="">Selecione</option>
            <option
              value="receita"
              selected={category?.type === "receita"}
            >
              Receita
            </option>
            <option
              value="despesa"
              selected={!category || category.type === "despesa"}
            >
              Despesa
            </option>
          </select>
          <FieldErrors errors={state.errors || {}} field="type" />
        </label>

        <label className="field">
          <span>Descricao</span>
          <textarea
            name="description"
            maxLength={500}
            placeholder="Opcional"
            disabled={pending}
            defaultValue={category?.description || ""}
          />
          <FieldErrors errors={state.errors || {}} field="description" />
        </label>

        <label className="field">
          <span>Status</span>
          <select name="is_active" required disabled={pending}>
            <option
              value="true"
              selected={category ? category.is_active : true}
            >
              Ativa
            </option>
            <option
              value="false"
              selected={category ? !category.is_active : false}
            >
              Inativa
            </option>
          </select>
          <FieldErrors errors={state.errors || {}} field="is_active" />
        </label>

        <button
          className="btn btn--primary"
          type="submit"
          disabled={pending}
        >
          {pending ? "Salvando..." : "Salvar categoria"}
        </button>
      </form>
    </article>
  );
}
