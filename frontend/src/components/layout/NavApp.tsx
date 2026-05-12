import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getInitials } from "@/lib/formatters";
import { env } from "@/config/env";
import type { User } from "@/types";

interface Props {
  currentUser: User;
  currentPath: string;
}

function isActivePath(current: string, target: string) {
  return current === target || current.startsWith(`${target}/`);
}

export function NavApp({ currentUser, currentPath }: Props) {
  return (
    <header className="container page-shell">
      <div className="app-header">
        <div className="brand">
          <div className="brand-mark">FP</div>
          <div className="brand-text">
            <strong>{env.appName}</strong>
            <span>
              {currentUser
                ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
                  currentUser.email
                : "Seu painel financeiro"}
            </span>
          </div>
        </div>

        <nav className="nav-links" aria-label="Navegacao do modulo">
          <Link
            className={isActivePath(currentPath, "/dashboard") ? "is-active" : ""}
            href="/dashboard"
            aria-current={isActivePath(currentPath, "/dashboard") ? "page" : undefined}
          >
            Dashboard
          </Link>
          <Link
            className={isActivePath(currentPath, "/categorias") ? "is-active" : ""}
            href="/categorias"
            aria-current={isActivePath(currentPath, "/categorias") ? "page" : undefined}
          >
            Categorias
          </Link>
          <Link
            className={isActivePath(currentPath, "/lancamentos") ? "is-active" : ""}
            href="/lancamentos"
            aria-current={isActivePath(currentPath, "/lancamentos") ? "page" : undefined}
          >
            Lancamentos
          </Link>
          <Link
            className={isActivePath(currentPath, "/orcamento") ? "is-active" : ""}
            href="/orcamento"
            aria-current={isActivePath(currentPath, "/orcamento") ? "page" : undefined}
          >
            Orcamento
          </Link>
          <Link
            className={isActivePath(currentPath, "/perfil") ? "is-active" : ""}
            href="/perfil"
            aria-current={isActivePath(currentPath, "/perfil") ? "page" : undefined}
          >
            Perfil
          </Link>
          <Link
            className={isActivePath(currentPath, "/analises") ? "is-active" : ""}
            href="/analises"
            aria-current={isActivePath(currentPath, "/analises") ? "page" : undefined}
          >
            Analises
          </Link>
        </nav>

        <div className="app-session">
          <div className="chip">
            <span
              className="brand-mark"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
              }}
            >
              {getInitials(currentUser)}
            </span>
            <span>{currentUser ? currentUser.email : "Conta autenticada"}</span>
          </div>
          <form action={logoutAction}>
            <button className="btn btn--ghost" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
