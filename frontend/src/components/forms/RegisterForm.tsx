"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Flash } from "@/components/ui/Flash";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState } from "@/types";

const INITIAL_STATE: ActionState = { ok: true };

interface Props {
  flash?: { type: string; message: string } | null;
}

export function RegisterForm({ flash }: Props) {
  const [state, action, pending] = useActionState(registerAction, INITIAL_STATE);

  return (
    <main className="container page-shell">
      <div className="auth-layout">
        <section className="auth-visual surface">
          <span className="eyebrow">Cadastro</span>
          <h2>Abra sua conta e comece com um fluxo padronizado.</h2>
          <p>
            O formulario segue a politica de senha exigida pelo backend e mostra
            mensagens claras quando algo falha.
          </p>
          <div className="hero-preview">
            <div className="hero-preview__grid">
              <div className="hero-preview__mini">
                <strong>Senha</strong>
                <span>Segura</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Email</strong>
                <span>Unico</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Perfil</strong>
                <span>Completo</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Fluxo</strong>
                <span>Direto</span>
              </div>
            </div>
          </div>
          <ul>
            <li>Nome, sobrenome, email e senha sao obrigatorios.</li>
            <li>
              Senha precisa ter maiuscula, minuscula, numero e caractere
              especial.
            </li>
            <li>
              Erros do backend aparecem por campo e no topo do formulario.
            </li>
          </ul>
        </section>

        <section className="auth-card surface surface--strong">
          <div>
            <h1>Criar conta</h1>
            <p>Preencha seus dados para acessar o modulo financeiro completo.</p>
          </div>

          <Flash flash={flash ?? null} />
          <ErrorBanner errors={state.errors || {}} />

          <form className="form-grid" action={action}>
            <div className="grid-2">
              <label className="field">
                <span>Nome</span>
                <input
                  type="text"
                  name="first_name"
                  autoComplete="given-name"
                  required
                  disabled={pending}
                />
                <FieldErrors errors={state.errors || {}} field="first_name" />
              </label>

              <label className="field">
                <span>Sobrenome</span>
                <input
                  type="text"
                  name="last_name"
                  autoComplete="family-name"
                  required
                  disabled={pending}
                />
                <FieldErrors errors={state.errors || {}} field="last_name" />
              </label>
            </div>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                disabled={pending}
              />
              <FieldErrors errors={state.errors || {}} field="email" />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={pending}
              />
              <small className="field-help">
                Minimo de 6 caracteres, com maiuscula, minuscula, numero e
                simbolo.
              </small>
              <FieldErrors errors={state.errors || {}} field="password" />
            </label>

            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={pending}
            >
              {pending ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="help">
            Ja tem cadastro? <Link href="/login">Entrar agora</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
