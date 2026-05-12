"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { setAuthCookies, clearAuthCookies, setFlash } from "@/lib/session";
import { normalizeErrors } from "@/lib/normalizers";
import type { ActionState } from "@/types";

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nextPath = (formData.get("next") as string) || "/dashboard";
  const payload = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const response = await api.auth.login(payload);

  if (response.status === 200 && (response.data as { access?: string })?.access) {
    const data = response.data as { access: string; refresh: string };
    await setAuthCookies({ accessToken: data.access, refreshToken: data.refresh });
    await setFlash("success", "Bem-vindo. Sua sessão foi iniciada com sucesso.");
    redirect(nextPath || "/dashboard");
  }

  if ([400, 401].includes(response.status)) {
    return {
      ok: false,
      errors: normalizeErrors(response.data),
    };
  }

  return {
    ok: false,
    errors: { general: ["Nao foi possivel entrar agora. Tente novamente em instantes."] },
  };
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payload = {
    first_name: (formData.get("first_name") as string)?.trim(),
    last_name: (formData.get("last_name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    password: formData.get("password") as string,
  };

  const response = await api.auth.register(payload);

  if (response.status === 201) {
    await setFlash("success", "Cadastro realizado com sucesso. Faca login para continuar.");
    redirect("/login");
  }

  if (response.status === 400) {
    return {
      ok: false,
      errors: normalizeErrors(response.data),
    };
  }

  return {
    ok: false,
    errors: { general: ["Nao foi possivel concluir o cadastro agora."] },
  };
}

export async function logoutAction(): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  await api.auth.logout({ refresh: refreshToken }).catch(() => null);
  await clearAuthCookies();
  await setFlash("info", "Voce saiu da plataforma com sucesso.");
  redirect("/login");
}
