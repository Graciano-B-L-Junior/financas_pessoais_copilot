"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { setFlash } from "@/lib/session";
import { normalizeErrors } from "@/lib/normalizers";
import type { ActionState } from "@/types";

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payload = {
    first_name: (formData.get("first_name") as string)?.trim(),
    last_name: (formData.get("last_name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
  };

  const response = await api.profile.update(payload);

  if (response.status === 200) {
    await setFlash("success", "Perfil atualizado com sucesso.");
    revalidatePath("/perfil");
    redirect("/perfil");
  }

  if ([400, 422].includes(response.status)) {
    return { ok: false, errors: normalizeErrors(response.data) };
  }

  if ([401, 403].includes(response.status)) redirect("/login");

  return { ok: false, errors: { general: ["Não foi possível atualizar o perfil."] } };
}
