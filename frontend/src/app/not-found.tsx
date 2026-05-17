"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container page-shell">
      <div className="empty-state surface" style={{ marginTop: "4rem", padding: "3rem" }}>
        <h1>404 — Página não encontrada</h1>
        <p>A página solicitada não existe.</p>
        <Link className="btn btn--primary" href="/">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
