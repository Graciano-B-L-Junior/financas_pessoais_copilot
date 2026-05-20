"use client";

import { useActionState, useRef, useState } from "react";
import { importPreviewAction, importConfirmAction } from "@/app/actions/spreadsheet";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
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
    <div style={{ display: "grid", gap: "3rem" }}>
      {/* ── Etapa 1: Upload ── */}
      {!preview && (
        <form ref={formRef} action={previewAction} style={{ display: "grid", gap: "2rem" }}>
          <div className="upload-zone">
            <label htmlFor="file-upload" className="upload-label">
              <p className="upload-text">
                {selectedFile
                  ? `📄 ${selectedFile.name}`
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

          <label className="field">
            <span>Ano da planilha</span>
            <small className="field-help">Opcional — detectado automaticamente pelo nome</small>
            <input
              type="number"
              name="year"
              placeholder="Ex: 2018"
              min={2000}
              max={2100}
            />
          </label>

          <ErrorBanner errors={previewState.errors || {}} />

          <div style={{ paddingTop: "1rem" }}>
            <button
              type="submit"
              disabled={previewPending || !selectedFile}
              className="btn btn--primary"
            >
              {previewPending ? "Analisando..." : "Analisar arquivo"}
            </button>
          </div>
        </form>
      )}

      {/* ── Etapa 2: Pré-visualização ── */}
      {preview && (
        <div style={{ display: "grid", gap: "2rem" }}>
          {/* Resumo estatístico */}
          <div className="grid grid-4">
            <SummaryCard label="Abas encontradas" value={preview.sheets_found.length} />
            <SummaryCard label="Categorias" value={preview.categories_found.length} />
            <SummaryCard label="Total de linhas" value={preview.total} />
            <SummaryCard
              label="Com erros"
              value={preview.error_count}
              highlight={preview.error_count > 0}
            />
          </div>

          {/* Categorias faltantes */}
          {preview.missing_categories.length > 0 && (
            <div className="alert alert--warning">
              <strong>Atenção:</strong> As seguintes categorias não existem no sistema e serão
              ignoradas:
              <ul className="list-disc list-inside mt-2">
                {preview.missing_categories.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela de preview */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Status</th>
                  <th>Aba</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <PreviewRow key={`${row.sheet}-${row.row_number}-${idx}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn--secondary"
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
                  className="btn btn--success"
                >
                  {confirmPending
                    ? "Salvando..."
                    : `Confirmar e salvar ${preview.valid_count} lançamento(s)`}
                </button>
              </form>
            )}
          </div>

          <ErrorBanner errors={confirmState.errors || {}} />
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
    <div className={`stat-card ${highlight ? "stat-card--highlight" : ""}`}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${highlight ? "stat-value--highlight" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function PreviewRow({ row }: { row: ImportPreviewRow }) {
  const hasError = row.errors.length > 0;
  const statusClass = hasError ? "badge--danger" : "badge--success";
  const statusText = hasError ? "Erro" : "OK";

  return (
    <tr>
      <td>
        <span className={`badge ${statusClass}`}>{statusText}</span>
      </td>
      <td>{row.sheet}</td>
      <td>
        {row.category_name}
        {!row.category_exists && (
          <span className="muted" style={{ marginLeft: "0.5rem" }}>(não cadastrada)</span>
        )}
      </td>
      <td>{row.description || "—"}</td>
      <td>{row.date ?? `dia ${row.day}`}</td>
      <td style={{ textAlign: "right", fontFamily: "monospace" }}>
        {row.amount != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              parseFloat(row.amount)
            )
          : "—"}
      </td>
      <td className="muted text-sm">{row.errors.join(" • ")}</td>
    </tr>
  );
}
