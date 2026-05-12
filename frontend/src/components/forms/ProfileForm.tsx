"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState, User } from "@/types";

const INITIAL_STATE: ActionState = { ok: true };

export function ProfileForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    INITIAL_STATE
  );

  return (
    <article className="surface form-card">
      <div className="page-heading">
        <span className="eyebrow">Meu perfil</span>
        <h2 className="section-title">Dados pessoais</h2>
      </div>

      <ErrorBanner errors={state.errors || {}} />

      <form className="form-grid" action={action}>
        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            name="first_name"
            defaultValue={user.first_name || ""}
            maxLength={150}
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="first_name" />
        </label>

        <label className="field">
          <span>Sobrenome</span>
          <input
            type="text"
            name="last_name"
            defaultValue={user.last_name || ""}
            maxLength={150}
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="last_name" />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            defaultValue={user.email || ""}
            required
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="email" />
        </label>

        <hr />
        <p className="helper-text">
          Preencha os campos abaixo apenas se quiser alterar sua senha.
        </p>

        <label className="field">
          <span>Nova senha</span>
          <input
            type="password"
            name="new_password"
            autoComplete="new-password"
            placeholder="Deixe em branco para manter a atual"
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="new_password" />
        </label>

        <label className="field">
          <span>Confirmar nova senha</span>
          <input
            type="password"
            name="confirm_password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            disabled={pending}
          />
          <FieldErrors errors={state.errors || {}} field="confirm_password" />
        </label>

        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </form>
    </article>
  );
}
