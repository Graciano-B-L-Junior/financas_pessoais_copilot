"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container page-shell">
      <div className="empty-state surface" style={{ marginTop: "4rem", padding: "3rem" }}>
        <h1>404 — Pagina nao encontrada</h1>
        <p>A pagina solicitada nao existe.</p>
        <Link className="btn btn--primary" href="/">
          Voltar ao inicio
        </Link>
      </div>
    </main>
  );
}
