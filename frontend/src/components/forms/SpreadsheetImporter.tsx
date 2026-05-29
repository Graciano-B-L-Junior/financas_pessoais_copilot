"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { importPreviewAction, importConfirmAction } from "@/app/actions/spreadsheet";
import { createCategoriesBulkAction } from "@/app/actions/categories";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ImportProgressBar } from "@/components/forms/ImportProgressBar";
import { PreviewProgressBar } from "@/components/forms/PreviewProgressBar";
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
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [asyncTask, setAsyncTask] = useState<{ taskId: string; queued: number } | null>(null);

  const preview = previewState.ok ? previewState.data! : null;

  // Inicializa / reseta a seleção sempre que uma nova análise retorna categorias faltantes
  const missingCats = preview?.missing_categories;
  useEffect(() => {
    setSelectedCategories(new Set(missingCats ?? []));
    setCreateResult(null);
  }, [missingCats]);

  // Detecta resposta assíncrona (202) do confirm e inicia polling
  useEffect(() => {
    if (confirmState.ok && confirmState.data && "taskId" in confirmState.data) {
      const { taskId, queued } = confirmState.data as { taskId: string; queued: number };
      setAsyncTask({ taskId, queued });
    }
  }, [confirmState]);

  // Linhas confirmáveis = sem erros E com categoria existente
  const confirmableRows = preview
    ? preview.rows.filter((r) => r.is_valid && r.category_exists)
    : [];

  function handleAutoCreate() {
    if (!selectedCategories.size) return;
    startCreateTransition(async () => {
      const result = await createCategoriesBulkAction([...selectedCategories]);
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
      {/* ── Progresso de importação assíncrona ── */}
      {asyncTask && (
        <ImportProgressBar
          taskId={asyncTask.taskId}
          queued={asyncTask.queued}
          onRetry={() => {
            setAsyncTask(null);
            window.location.reload();
          }}
        />
      )}

      {/* ── Etapa 1: Upload ── */}
      {!preview && !asyncTask && (
        <form ref={formRef} action={previewAction} style={{ display: "grid", gap: "2rem" }}>
          {/* Barra de progresso durante a análise (preview) */}
          {previewPending && <PreviewProgressBar />}
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

          {/* ── Painel de categorias faltantes com checkbox (RF010 / RF011) ── */}
          {preview.missing_categories.length > 0 && (
            <div className="alert alert--warning" style={{ borderLeftWidth: "4px" }}>
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                Categorias não encontradas no sistema
              </strong>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem" }}>
                As categorias abaixo estão na planilha mas não existem no seu cadastro.
                Selecione quais deseja criar ou{" "}
                <a href="/categorias">gerencie suas categorias</a>.
              </p>

              {createResult ? (
                <p style={{ margin: 0, color: "var(--success)", fontWeight: 500 }}>
                  ✓ {createResult.created} categoria(s) criada(s) como <em>Despesa</em>.
                  {createResult.skipped > 0 && ` ${createResult.skipped} ignorada(s) (já existem).`}
                  {" "}Re-analisando o arquivo...
                </p>
              ) : (
                <>
                  {/* Controle select-all + contador */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "0.75rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.size === preview.missing_categories.length}
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              selectedCategories.size > 0 &&
                              selectedCategories.size < preview.missing_categories.length;
                        }}
                        onChange={(e) =>
                          setSelectedCategories(
                            e.target.checked ? new Set(preview.missing_categories) : new Set()
                          )
                        }
                      />
                      Selecionar todas
                    </label>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      {selectedCategories.size} de {preview.missing_categories.length} selecionada(s)
                    </span>
                  </div>

                  {/* Lista de checkboxes individuais */}
                  <ul style={{ margin: "0 0 1rem 0", padding: 0, listStyle: "none", display: "grid", gap: "0.4rem" }}>
                    {preview.missing_categories.map((c) => (
                      <li key={c}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(c)}
                            onChange={(e) =>
                              setSelectedCategories((prev) => {
                                const next = new Set(prev);
                                e.target.checked ? next.add(c) : next.delete(c);
                                return next;
                              })
                            }
                          />
                          {c}
                        </label>
                      </li>
                    ))}
                  </ul>

                  {/* Ações */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleAutoCreate}
                      disabled={createPending || selectedCategories.size === 0}
                      className="btn btn--primary"
                    >
                      {createPending
                        ? "Criando categorias..."
                        : `Criar ${selectedCategories.size} categoria(s) selecionada(s)`}
                    </button>
                    <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                      Serão criadas como <strong>Despesa</strong>. Edite o tipo depois em{" "}
                      <a href="/categorias">Categorias</a>.
                    </span>
                  </div>
                </>
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
