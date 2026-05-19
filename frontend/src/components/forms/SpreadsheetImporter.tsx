"use client";

import { useActionState, useRef, useState } from "react";
import { importPreviewAction, importConfirmAction } from "@/app/actions/spreadsheet";
import type { ActionState, ImportPreviewResult, ImportPreviewRow } from "@/types";

const INITIAL_PREVIEW: ActionState<ImportPreviewResult> = { ok: false };
const INITIAL_CONFIRM: ActionState = { ok: false };

export function SpreadsheetImporter() {
  const [previewState, previewAction, previewPending] = useActionState(
    importPreviewAction,
    INITIAL_PREVIEW
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    importConfirmAction,
    INITIAL_CONFIRM
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const preview = previewState.ok ? previewState.data! : null;

  return (
    <div className="space-y-8">
      {/* ── Etapa 1: Upload ── */}
      {!preview && (
        <form ref={formRef} action={previewAction} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-sm text-gray-500">
                {selectedFile
                  ? `Arquivo selecionado: ${selectedFile.name}`
                  : "Clique ou arraste o arquivo .xlsx aqui"}
              </p>
              <input
                id="file-upload"
                type="file"
                name="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label htmlFor="year-input" className="block text-sm font-medium text-gray-700 mb-1">
              Ano da planilha (opcional — detectado automaticamente pelo nome do arquivo)
            </label>
            <input
              id="year-input"
              type="number"
              name="year"
              placeholder="Ex: 2018"
              min={2000}
              max={2100}
              className="border rounded px-3 py-2 text-sm w-32"
            />
          </div>

          {previewState.errors?.general && (
            <p className="text-sm text-red-600">{previewState.errors.general[0]}</p>
          )}

          <button
            type="submit"
            disabled={previewPending || !selectedFile}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {previewPending ? "Analisando..." : "Analisar arquivo"}
          </button>
        </form>
      )}

      {/* ── Etapa 2: Pré-visualização completa ── */}
      {preview && (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <SummaryCard label="Abas encontradas" value={preview.sheets_found.length} />
            <SummaryCard label="Categorias" value={preview.categories_found.length} />
            <SummaryCard label="Total de linhas" value={preview.total} />
            <SummaryCard
              label="Com erros"
              value={preview.error_count}
              highlight={preview.error_count > 0}
            />
          </div>

          {/* Categorias faltantes no banco */}
          {preview.missing_categories.length > 0 && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
              <strong>Atenção:</strong> As seguintes categorias não existem no sistema e serão
              ignoradas na importação (crie-as antes de confirmar):
              <ul className="mt-1 list-disc list-inside">
                {preview.missing_categories.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela completa de lançamentos */}
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Aba</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Descrição</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-right">Valor (R$)</th>
                  <th className="px-3 py-2 text-left">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <PreviewRow key={`${row.sheet}-${row.row_number}-${idx}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações: cancelar ou confirmar */}
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border px-4 py-2 rounded text-sm text-gray-700"
            >
              Cancelar
            </button>

            {preview.valid_count > 0 && (
              <form action={confirmAction}>
                <input type="hidden" name="rows" value={JSON.stringify(preview.rows)} />
                <input type="hidden" name="category_map" value="{}" />
                <button
                  type="submit"
                  disabled={confirmPending}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {confirmPending
                    ? "Salvando..."
                    : `Confirmar e salvar ${preview.valid_count} lançamento(s)`}
                </button>
              </form>
            )}
          </div>

          {confirmState.errors?.general && (
            <p className="text-sm text-red-600">{confirmState.errors.general[0]}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded border p-3 ${highlight ? "border-red-300 bg-red-50" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? "text-red-700" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}

function PreviewRow({ row }: { row: ImportPreviewRow }) {
  const hasError = row.errors.length > 0;

  return (
    <tr className={hasError ? "bg-red-50" : "odd:bg-white even:bg-gray-50"}>
      <td className="px-3 py-1.5">
        {hasError ? (
          <span className="inline-block rounded bg-red-100 px-1.5 text-red-700 text-xs font-medium">
            Erro
          </span>
        ) : (
          <span className="inline-block rounded bg-green-100 px-1.5 text-green-700 text-xs font-medium">
            OK
          </span>
        )}
      </td>
      <td className="px-3 py-1.5 text-gray-600">{row.sheet}</td>
      <td className="px-3 py-1.5">
        {row.category_name}
        {!row.category_exists && (
          <span className="ml-1 text-yellow-600 text-xs">(não cadastrada)</span>
        )}
      </td>
      <td className="px-3 py-1.5 max-w-[200px] truncate">{row.description || "—"}</td>
      <td className="px-3 py-1.5 whitespace-nowrap">{row.date ?? `dia ${row.day}`}</td>
      <td className="px-3 py-1.5 text-right font-mono">
        {row.amount != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              parseFloat(row.amount)
            )
          : "—"}
      </td>
      <td className="px-3 py-1.5 text-red-600 text-xs">
        {row.errors.join(" · ")}
      </td>
    </tr>
  );
}
