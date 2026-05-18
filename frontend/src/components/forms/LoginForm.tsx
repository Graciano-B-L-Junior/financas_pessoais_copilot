"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Flash } from "@/components/ui/Flash";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FieldErrors } from "@/components/ui/FieldErrors";
import type { ActionState } from "@/types";

const INITIAL_STATE: ActionState = { ok: true };

interface Props {
  nextPath?: string;
  flash?: { type: string; message: string } | null;
}

export function LoginForm({ nextPath = "/dashboard", flash }: Props) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <main className="container page-shell">
      <div className="auth-layout">
        <section className="auth-visual surface">
          <span className="eyebrow">Acesso seguro</span>
          <h2>
            Entre para controlar categorias, lançamentos e indicadores.
          </h2>
          <p>
            O front preserva a sessão em cookies HttpOnly e redireciona para o
            painel quando a autenticação é válida.
          </p>
          <div className="hero-preview">
            <div className="hero-preview__grid">
              <div className="hero-preview__mini">
                <strong>Resumo rápido</strong>
                <span>Dashboard</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Operações</strong>
                <span>CRUD</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Alertas</strong>
                <span>Insights</span>
              </div>
              <div className="hero-preview__mini">
                <strong>Conta</strong>
                <span>Perfil</span>
              </div>
            </div>
          </div>
          <ul>
            <li>Tokens guardados fora do JavaScript do navegador.</li>
            <li>Reaproveitamento de sessao via refresh automatico.</li>
            <li>Mensagens de erro inline para email e senha.</li>
          </ul>
        </section>

        <section className="auth-card surface surface--strong">
          <div>
            <h1>Entrar</h1>
            <p>
              Acesse sua área financeira com segurança e sem etapas
              desnecessárias.
            </p>
          </div>

          <Flash flash={flash ?? null} />
          <ErrorBanner errors={state.errors || {}} />

          <form className="form-grid" action={action}>
            <input type="hidden" name="next" value={nextPath} />

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
                autoComplete="current-password"
                required
                disabled={pending}
              />
              <FieldErrors errors={state.errors || {}} field="password" />
            </label>

            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={pending}
            >
              {pending ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="help">
            Ainda não tem conta?{" "}
            <Link href="/register">Crie sua conta</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
