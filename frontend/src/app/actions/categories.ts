"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { setFlash } from "@/lib/session";
import { normalizeErrors, parseBoolean } from "@/lib/normalizers";
import type { ActionState } from "@/types";

function buildCategoryPayload(formData: FormData) {
  return {
    name: (formData.get("name") as string)?.trim(),
    type: formData.get("type") as string,
    description: ((formData.get("description") as string) || "").trim(),
    is_active:
      formData.get("is_active") === undefined
        ? true
        : parseBoolean(formData.get("is_active") as string, true),
  };
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const response = await api.categories.create(buildCategoryPayload(formData));

  if (response.status === 201) {
    await setFlash("success", "Categoria cadastrada com sucesso.");
    revalidatePath("/categorias");
    redirect("/categorias");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Não foi possível cadastrar a categoria."] } };
}

export async function updateCategoryAction(
  id: number | string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const response = await api.categories.update(id, buildCategoryPayload(formData));

  if (response.status === 200) {
    await setFlash("success", "Categoria atualizada com sucesso.");
    revalidatePath("/categorias");
    redirect("/categorias");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Não foi possível atualizar a categoria."] } };
}

export async function toggleCategoryStatusAction(
  id: number | string,
  isActive: boolean
): Promise<void> {
  const response = await api.categories.update(id, { is_active: isActive });
  if (response.status === 200) {
    await setFlash("success", "Status da categoria atualizado.");
  }
  revalidatePath("/categorias");
  redirect("/categorias");
}

export async function deleteCategoryAction(id: number | string): Promise<void> {
  const response = await api.categories.delete(id);
  if ([401, 403].includes(response.status)) redirect("/login");
  await setFlash("info", "Categoria removida com sucesso.");
  revalidatePath("/categorias");
  redirect("/categorias");
}
