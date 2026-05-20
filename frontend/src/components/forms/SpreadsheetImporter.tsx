"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { importPreviewAction, importConfirmAction } from "@/app/actions/spreadsheet";
import { createCategoriesBulkAction } from "@/app/actions/categories";
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
  const [createPending, startCreateTransition] = useTransition();
  const [createResult, setCreateResult] = useState<{ created: number; skipped: number } | null>(null);

  const preview = previewState.ok ? previewState.data! : null;

  // Linhas confirmáveis = sem erros E com categoria existente
  const confirmableRows = preview
    ? preview.rows.filter((r) => r.is_valid && r.category_exists)
    : [];

  function handleAutoCreate() {
    if (!preview?.missing_categories.length) return;
    setCreateResult(null);
    startCreateTransition(async () => {
      const result = await createCategoriesBulkAction(preview.missing_categories);
      if (result.ok && result.data) {
        setCreateResult(result.data);
        // Re-analisa o arquivo automaticamente com as categorias agora criadas
        if (selectedFile) {
          const fd = new FormData();
          fd.append("file", selectedFile);
          previewAction(fd);
        }
      }
    });
  }

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

          {/* ── Bloco de categorias faltantes (RF010) ── */}
          {preview.missing_categories.length > 0 && (
            <div className="alert alert--warning" style={{ borderLeftWidth: "4px" }}>
              <strong style={{ display: "block", marginBottom: "0.75rem" }}>
                Categorias não encontradas no sistema
              </strong>
              <p style={{ margin: "0 0 0.75rem 0" }}>
                As seguintes categorias estão na planilha mas não existem no seu cadastro.
                Os lançamentos vinculados a elas foram{" "}
                <strong>excluídos do lote de confirmação</strong>.
              </p>
              <ul style={{ margin: "0 0 1rem 1.25rem", padding: 0 }}>
                {preview.missing_categories.map((c) => (
                  <li key={c} style={{ marginBottom: "0.25rem" }}>{c}</li>
                ))}
              </ul>
              {createResult ? (
                <p style={{ margin: 0, color: "var(--success)", fontWeight: 500 }}>
                  ✓ {createResult.created} categoria(s) criada(s) como <em>Despesa</em>.
                  {createResult.skipped > 0 && ` ${createResult.skipped} ignorada(s) (já existem).`}
                  {" "}Re-analisando o arquivo...
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAutoCreate}
                    disabled={createPending}
                    className="btn btn--primary"
                  >
                    {createPending
                      ? "Criando categorias..."
                      : `Criar ${preview.missing_categories.length} categoria(s) automaticamente`}
                  </button>
                  <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                    Serão criadas como <strong>Despesa</strong>. Você pode editar o tipo depois em{" "}
                    <a href="/categorias">Categorias</a>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tabela de preview */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Status</th>
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
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn--secondary"
            >
              Cancelar
            </button>

            {confirmableRows.length > 0 && (
              <form action={confirmAction}>
                <input type="hidden" name="rows" value={JSON.stringify(confirmableRows)} />
                <input type="hidden" name="category_map" value="{}" />
                <button
                  type="submit"
                  disabled={confirmPending}
                  className="btn btn--success"
                >
                  {confirmPending
                    ? "Salvando..."
                    : `Confirmar e salvar ${confirmableRows.length} lançamento(s)`}
                </button>
              </form>
            )}

            {confirmableRows.length === 0 && (
              <p style={{ margin: 0, color: "var(--danger)", fontWeight: 500, fontSize: "0.95rem" }}>
                Nenhum lançamento válido para confirmar. Crie as categorias e reanalize a planilha.
              </p>
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
  const missingCategory = !row.category_exists;

  let badgeClass: string;
  let badgeText: string;

  if (hasError) {
    badgeClass = "badge--danger";
    badgeText = "Erro";
  } else if (missingCategory) {
    badgeClass = "badge--warning";
    badgeText = "Cat. inválida";
  } else {
    badgeClass = "badge--success";
    badgeText = "OK";
  }

  return (
    <tr style={missingCategory ? { opacity: 0.65 } : undefined}>
      <td>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </td>
      <td>{row.sheet}</td>
      <td>{row.category_name}</td>
      <td>{row.description || "—"}</td>
      <td>{row.date ?? `dia ${row.day}`}</td>
      <td style={{ textAlign: "right", fontFamily: "monospace" }}>
        {row.amount != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              parseFloat(row.amount)
            )
          : "—"}
      </td>
      <td style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
        {hasError ? row.errors.join(" • ") : missingCategory ? "Categoria não cadastrada no sistema" : "—"}
      </td>
    </tr>
  );
}
