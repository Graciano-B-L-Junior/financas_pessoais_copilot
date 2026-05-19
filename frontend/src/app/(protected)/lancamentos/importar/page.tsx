import type { Metadata } from "next";
import Link from "next/link";
import { SpreadsheetImporter } from "@/components/forms/SpreadsheetImporter";
import { consumeFlash } from "@/lib/session";
import { Flash } from "@/components/ui/Flash";

export const metadata: Metadata = { title: "Importar Planilha" };

export default async function ImportarPlanilhaPage() {
  const flash = await consumeFlash();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Flash flash={flash} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Importar Planilha</h1>
          <p className="text-sm text-gray-500 mt-1">
            Importe seus lançamentos a partir de um arquivo .xlsx no formato de controle mensal de
            gastos (abas por mês, tabelas por categoria).
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/template"
            className="text-sm border rounded px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            Baixar template vazio
          </a>
          <Link
            href="/lancamentos"
            className="text-sm border rounded px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium mb-4">Passo 1 — Selecione o arquivo</h2>
        <SpreadsheetImporter />
      </div>

      {/* Instruções de formato */}
      <details className="rounded border bg-gray-50 p-4 text-sm">
        <summary className="cursor-pointer font-medium text-gray-700">
          Formato esperado da planilha
        </summary>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>Arquivo .xlsx com abas mensais nomeadas como &quot;Gastos Janeiro&quot;, &quot;Gastos Fevereiro&quot; etc.</li>
          <li>
            Cada aba contém tabelas por categoria dispostas lado a lado com as colunas:{" "}
            <strong>Observação</strong>, <strong>dia</strong> e <strong>R$</strong>.
          </li>
          <li>O nome da categoria fica 1 ou 2 linhas acima dessas colunas.</li>
          <li>O ano é detectado automaticamente pelo nome do arquivo (ex: &quot;Gastos 2024.xlsx&quot;).</li>
          <li>Abas faltantes são ignoradas — não é necessário ter todos os meses.</li>
        </ul>
      </details>
    </div>
  );
}
