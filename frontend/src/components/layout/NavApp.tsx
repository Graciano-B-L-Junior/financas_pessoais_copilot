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
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-mark">FP</div>
        <div className="brand-text">
          <strong>{env.appName}</strong>
        </div>
      </div>

      <span className="app-sidebar__group-label">Menu</span>

      <nav className="app-sidebar__nav" aria-label="Navegação do módulo">
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/dashboard") ? " is-active" : ""}`}
          href="/dashboard"
          aria-current={isActivePath(currentPath, "/dashboard") ? "page" : undefined}
        >
          Dashboard
        </Link>
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/lancamentos") ? " is-active" : ""}`}
          href="/lancamentos"
          aria-current={isActivePath(currentPath, "/lancamentos") ? "page" : undefined}
        >
          Lançamentos
        </Link>
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/categorias") ? " is-active" : ""}`}
          href="/categorias"
          aria-current={isActivePath(currentPath, "/categorias") ? "page" : undefined}
        >
          Categorias
        </Link>
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/orcamento") ? " is-active" : ""}`}
          href="/orcamento"
          aria-current={isActivePath(currentPath, "/orcamento") ? "page" : undefined}
        >
          Orçamento
        </Link>
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/analises") ? " is-active" : ""}`}
          href="/analises"
          aria-current={isActivePath(currentPath, "/analises") ? "page" : undefined}
        >
          Análises
        </Link>
        <Link
          className={`app-sidebar__link${isActivePath(currentPath, "/perfil") ? " is-active" : ""}`}
          href="/perfil"
          aria-current={isActivePath(currentPath, "/perfil") ? "page" : undefined}
        >
          Perfil
        </Link>
      </nav>

      <div className="app-sidebar__session">
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
          <button className="btn btn--ghost btn--full" type="submit">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
