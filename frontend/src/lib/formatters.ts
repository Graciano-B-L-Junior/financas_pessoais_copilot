import { env } from "@/config/env";

const LOCALE = env.locale;
const CURRENCY = env.currency;

export function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat(LOCALE, {
    currency: CURRENCY,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value || 0));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const raw =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const date =
    raw.length === 10 ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(date);
}

export function formatDateInput(
  value: string | Date | null | undefined
): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatPercent(value: number | string | null | undefined): string {
  const numeric = Number(value || 0);
  const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
  return `${percent.toLocaleString(LOCALE, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`;
}

export function getInitials(user: { first_name?: string; last_name?: string; email?: string } | null | undefined): string {
  if (!user) return "?";
  const first = user.first_name?.[0] || "";
  const last = user.last_name?.[0] || "";
  if (first || last) return `${first}${last}`.toUpperCase();
  return (user.email?.[0] || "?").toUpperCase();
}

export function currentMonthInput(): string {
  return new Date().toISOString().slice(0, 7);
}
