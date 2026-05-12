"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { setFlash } from "@/lib/session";
import { normalizeErrors, parseMoney, parseInteger } from "@/lib/normalizers";
import type { ActionState } from "@/types";

interface BudgetCategoryRow {
  category_id: string;
  budgeted_amount: string;
}

function parseBudgetCategories(formData: FormData): BudgetCategoryRow[] {
  const entries: BudgetCategoryRow[] = [];
  let i = 0;
  while (formData.has(`categories[${i}][category_id]`)) {
    entries.push({
      category_id: formData.get(`categories[${i}][category_id]`) as string,
      budgeted_amount: formData.get(`categories[${i}][budgeted_amount]`) as string,
    });
    i++;
  }
  return entries.filter((e) => e.category_id || e.budgeted_amount);
}

function buildBudgetPayload(formData: FormData) {
  const rows = parseBudgetCategories(formData);
  return {
    month: (formData.get("month") as string)?.trim(),
    total_amount: parseMoney(formData.get("total_amount") as string),
    categories: rows.map((r) => ({
      category_id: parseInteger(r.category_id),
      budgeted_amount: parseMoney(r.budgeted_amount),
    })),
  };
}

export async function createBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const response = await api.budgets.create(buildBudgetPayload(formData));

  if (response.status === 201) {
    await setFlash("success", "Orcamento cadastrado com sucesso.");
    revalidatePath("/orcamento");
    redirect("/orcamento");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Nao foi possivel cadastrar o orcamento."] } };
}

export async function finalizeBudgetAction(id: number | string): Promise<void> {
  const response = await api.budgets.finalize(id);
  if ([401, 403].includes(response.status)) redirect("/login");
  if (response.status === 200) {
    await setFlash("success", "Orcamento finalizado com sucesso.");
  } else {
    await setFlash("warning", "Nao foi possivel finalizar o orcamento.");
  }
  revalidatePath("/orcamento");
  redirect("/orcamento");
}

export async function deleteBudgetAction(id: number | string): Promise<void> {
  const response = await api.budgets.delete(id);
  if ([401, 403].includes(response.status)) redirect("/login");
  await setFlash("info", "Orcamento removido com sucesso.");
  revalidatePath("/orcamento");
  redirect("/orcamento");
}
