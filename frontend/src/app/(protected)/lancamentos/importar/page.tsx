import type { Metadata } from "next";
import Link from "next/link";
import { SpreadsheetImporter } from "@/components/forms/SpreadsheetImporter";
import { consumeFlash } from "@/lib/session";
import { Flash } from "@/components/ui/Flash";

export const metadata: Metadata = { title: "Importar Planilha" };

export default async function ImportarPlanilhaPage() {
  const flash = await consumeFlash();

  return (
    <main className="container page-shell" style={{ display: "grid", gap: "1.5rem" }}>
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Importação</span>
          <h1>Importar Planilha de Lançamentos</h1>
          <p>
            Importe seus lançamentos a partir de um arquivo .xlsx no formato de controle mensal de
            gastos (abas por mês, tabelas por categoria).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
            <Link href="/lancamentos" className="btn btn--secondary text-sm">
              Voltar
            </Link>
          </div>
        </div>

        <Flash flash={flash ?? null} />
      </section>

      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Passo 1</span>
          <h2 className="section-title">Selecione o arquivo</h2>
        </div>
        <SpreadsheetImporter />
      </section>

      <section className="surface panel">
        <details className="details-group">
          <summary>Formato esperado da planilha</summary>
          <div className="details-content">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Arquivo .xlsx com abas mensais nomeadas como "Gastos Janeiro", "Gastos Fevereiro" etc.</li>
              <li>
                Cada aba contém tabelas por categoria dispostas lado a lado com as colunas:{" "}
                <strong>Observação</strong>, <strong>dia</strong> e <strong>R$</strong>.
              </li>
              <li>O nome da categoria fica 1 ou 2 linhas acima dessas colunas.</li>
              <li>O ano é detectado automaticamente pelo nome do arquivo (ex: "Gastos 2024.xlsx").</li>
              <li>Abas faltantes são ignoradas — não é necessário ter todos os meses.</li>
            </ul>
          </div>
        </details>
      </section>
    </main>
  );
}
