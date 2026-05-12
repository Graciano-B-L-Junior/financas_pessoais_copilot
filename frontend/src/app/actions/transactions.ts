"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { setFlash } from "@/lib/session";
import { normalizeErrors, parseMoney, parseInteger, parseDate, parseBoolean } from "@/lib/normalizers";
import type { ActionState } from "@/types";

function buildTransactionPayload(formData: FormData) {
  const isRecurring = parseBoolean(formData.get("is_recurring") as string, false);
  return {
    amount: parseMoney(formData.get("amount") as string),
    category: parseInteger(formData.get("category") as string),
    date: parseDate(formData.get("date") as string),
    description: ((formData.get("description") as string) || "").trim(),
    type: formData.get("type") as string,
    is_recurring: isRecurring,
    ...(isRecurring && {
      frequency: ((formData.get("frequency") as string) || "").trim() || undefined,
      start_date: parseDate(formData.get("start_date") as string),
      end_date: parseDate(formData.get("end_date") as string),
    }),
  };
}

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const response = await api.transactions.create(buildTransactionPayload(formData));

  if (response.status === 201) {
    await setFlash("success", "Lancamento cadastrado com sucesso.");
    revalidatePath("/lancamentos");
    redirect("/lancamentos");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Nao foi possivel cadastrar o lancamento."] } };
}

export async function updateTransactionAction(
  id: number | string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const response = await api.transactions.update(id, buildTransactionPayload(formData));

  if (response.status === 200) {
    await setFlash("success", "Lancamento atualizado com sucesso.");
    revalidatePath("/lancamentos");
    redirect("/lancamentos");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Nao foi possivel atualizar o lancamento."] } };
}

export async function deleteTransactionAction(id: number | string): Promise<void> {
  const response = await api.transactions.delete(id);
  if ([401, 403].includes(response.status)) redirect("/login");
  await setFlash("info", "Lancamento removido com sucesso.");
  revalidatePath("/lancamentos");
  redirect("/lancamentos");
}
