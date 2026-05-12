import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { env } from "@/config/env";

interface Props {
  isAuthenticated: boolean;
}

export function NavPublic({ isAuthenticated }: Props) {
  return (
    <header className="container page-shell">
      <div className="site-header">
        <div className="brand">
          <div className="brand-mark">FP</div>
          <div className="brand-text">
            <strong>{env.appName}</strong>
            <span>controle financeiro em camadas claras e seguras</span>
          </div>
        </div>

        <nav className="site-actions" aria-label="Navegação principal">
          {isAuthenticated ? (
            <>
              <Link className="btn btn--soft" href="/dashboard">
                Abrir painel
              </Link>
              <form action={logoutAction}>
                <button className="btn btn--ghost" type="submit">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="btn btn--ghost" href="/login">
                Entrar
              </Link>
              <Link className="btn btn--primary" href="/register">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
