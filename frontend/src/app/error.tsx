"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container page-shell">
      <div className="empty-state surface" style={{ marginTop: "4rem", padding: "3rem" }}>
        <h1>Erro interno</h1>
        <p>{error.message || "Ocorreu um erro inesperado."}</p>
        <button className="btn btn--primary" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
