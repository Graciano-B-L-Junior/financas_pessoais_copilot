"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { setFlash } from "@/lib/session";
import type { ActionState, ImportPreviewResult } from "@/types";

export async function importPreviewAction(
  _prev: ActionState<ImportPreviewResult>,
  formData: FormData
): Promise<ActionState<ImportPreviewResult>> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, errors: { general: ["Nenhum arquivo selecionado."] } };
  }

  const response = await api.transactions.importPreview(formData);

  if (response.status === 200) {
    return { ok: true, data: response.data as ImportPreviewResult };
  }

  if ([400, 422].includes(response.status)) {
    const detail = (response.data as { detail?: string })?.detail;
    return { ok: false, errors: { general: [detail ?? "Arquivo inválido."] } };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Erro ao processar o arquivo. Tente novamente."] } };
}

export async function importConfirmAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawRows = formData.get("rows") as string;
  const rawCategoryMap = formData.get("category_map") as string;

  let rows: unknown[];
  let category_map: Record<string, number>;

  try {
    rows = JSON.parse(rawRows);
    category_map = JSON.parse(rawCategoryMap ?? "{}");
  } catch {
    return { ok: false, errors: { general: ["Dados inválidos. Reenvie o arquivo."] } };
  }

  const response = await api.transactions.importConfirm({ rows, category_map });

  if (response.status === 201) {
    const data = response.data as { created: number; skipped: number; total: number };
    await setFlash(
      "success",
      `Importação concluída: ${data.created} lançamento(s) criado(s), ${data.skipped} ignorado(s).`
    );
    revalidatePath("/lancamentos");
    redirect("/lancamentos");
  }

  if (response.status === 202) {
    const data = response.data as { task_id: string; queued: number };
    return { ok: true, data: { taskId: data.task_id, queued: data.queued } } as ActionState<{ taskId: string; queued: number }>;
  }

  if ([400, 422].includes(response.status)) {
    const detail = (response.data as { detail?: string })?.detail;
    return { ok: false, errors: { general: [detail ?? "Não foi possível importar os dados."] } };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Erro inesperado. Tente novamente."] } };
}
