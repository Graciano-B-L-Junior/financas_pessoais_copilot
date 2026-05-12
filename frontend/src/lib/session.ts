import { cookies } from "next/headers";
import { env } from "@/config/env";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: env.cookieSecure,
};

const FLASH_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 10,
};

export async function setAuthCookies(tokens: {
  accessToken?: string;
  refreshToken?: string;
}) {
  const cookieStore = await cookies();
  if (tokens.accessToken) {
    cookieStore.set("access_token", tokens.accessToken, AUTH_COOKIE_OPTIONS);
  }
  if (tokens.refreshToken) {
    cookieStore.set("refresh_token", tokens.refreshToken, AUTH_COOKIE_OPTIONS);
  }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

export async function setFlash(type: string, message: string) {
  const cookieStore = await cookies();
  cookieStore.set("flash_type", type, FLASH_COOKIE_OPTIONS);
  cookieStore.set("flash_message", message, FLASH_COOKIE_OPTIONS);
}

export async function consumeFlash(): Promise<{
  type: string;
  message: string;
} | null> {
  const cookieStore = await cookies();
  const type = cookieStore.get("flash_type")?.value;
  const message = cookieStore.get("flash_message")?.value;

  if (type || message) {
    cookieStore.delete("flash_type");
    cookieStore.delete("flash_message");
  }

  if (!type && !message) return null;
  return { type: type || "info", message: message || "" };
}

export async function hasAuthCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(
    cookieStore.get("access_token")?.value ||
      cookieStore.get("refresh_token")?.value
  );
}
