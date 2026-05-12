import type { FormErrors, PaginationMetadata } from "@/types";

export function normalizeItem<T extends object>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return (payload ?? {}) as T;
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === "object" && !Array.isArray(p.data))
    return p.data as T;
  if (p.result && typeof p.result === "object" && !Array.isArray(p.result))
    return p.result as T;
  return payload as T;
}

export function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.results)) return p.results as T[];
  if (Array.isArray(p.data)) return p.data as T[];
  if (Array.isArray(p.items)) return p.items as T[];
  return [];
}

export function extractPagination(
  payload: unknown
): PaginationMetadata | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  
  if (
    typeof p.count === "number" &&
    (p.next === null || typeof p.next === "string") &&
    (p.previous === null || typeof p.previous === "string")
  ) {
    return {
      count: p.count,
      next: p.next as string | null,
      previous: p.previous as string | null,
    };
  }
  
  return null;
}

function flattenMessages(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenMessages);
  if (value && typeof value === "object")
    return Object.values(value as object).flatMap(flattenMessages);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

export function normalizeErrors(payload: unknown): FormErrors {
  const normalized: FormErrors = { general: [] };
  if (!payload) {
    normalized.general = ["Nao foi possivel concluir a operacao."];
    return normalized;
  }
  const p = payload as Record<string, unknown>;
  const source =
    p.errors && typeof p.errors === "object" ? (p.errors as Record<string, unknown>) : p;

  for (const [key, value] of Object.entries(source)) {
    if (["status", "status_text"].includes(key)) continue;
    const messages = flattenMessages(value);
    if (!messages.length) continue;
    if (["detail", "message", "non_field_errors"].includes(key)) {
      normalized.general.push(...messages);
    } else {
      normalized[key] = messages;
    }
  }

  if (!normalized.general.length) {
    normalized.general.push(...flattenMessages(p.message || p.detail));
  }
  if (!normalized.general.length) {
    normalized.general.push("Nao foi possivel concluir a operacao.");
  }
  return normalized;
}

export function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export function parseBoolean(
  value: string | boolean | undefined | null,
  fallback = false
): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

export function parseInteger(
  value: string | number | undefined | null
): number | string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = String(value).trim();
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

export function parseMoney(
  value: string | number | undefined | null
): number | string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const normalized =
    raw.includes(",") && raw.includes(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(",", ".");
  const cleaned = normalized.replace(/[^\d.-]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : raw;
}

export function parseDate(
  value: string | undefined | null
): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  return raw ? raw : null;
}
