const { currency, locale } = require("../config/env");

function normalizeItem(payload) {
  if (!payload || typeof payload !== "object") {
    return payload || {};
  }

  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) {
    return payload.result;
  }

  return payload;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

function flattenMessages(value) {
  if (Array.isArray(value)) {
    return value.flatMap(flattenMessages);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenMessages);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [String(value)];
}

function normalizeErrors(payload) {
  const normalized = { general: [] };

  if (!payload) {
    normalized.general.push("Nao foi possivel concluir a operacao.");
    return normalized;
  }

  const source = payload.errors && typeof payload.errors === "object" ? payload.errors : payload;

  if (typeof source !== "object") {
    normalized.general.push(...flattenMessages(source));
    return normalized;
  }

  for (const [key, value] of Object.entries(source)) {
    if (["status", "status_text"].includes(key)) {
      continue;
    }

    const messages = flattenMessages(value);
    if (!messages.length) {
      continue;
    }

    if (["detail", "message", "non_field_errors"].includes(key)) {
      normalized.general.push(...messages);
    } else {
      normalized[key] = messages;
    }
  }

  if (!normalized.general.length) {
    normalized.general.push(...flattenMessages(payload.message || payload.detail));
  }

  if (!normalized.general.length) {
    normalized.general.push("Nao foi possivel concluir a operacao.");
  }

  return normalized;
}

function removeUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function parseInteger(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const raw = String(value).trim();
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

function parseMoney(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  const normalized = raw.includes(",") && raw.includes(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(",", ".");
  const cleaned = normalized.replace(/[^\d.-]/g, "");
  const numeric = Number(cleaned);

  return Number.isFinite(numeric) ? numeric : raw;
}

function parseDate(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const raw = String(value).trim();
  return raw ? raw : null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const date = raw.length === 10 ? new Date(`${raw}T12:00:00`) : new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

function formatDateInput(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;

  return `${percent.toLocaleString(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
}

function getInitials(user) {
  if (!user) {
    return "FP";
  }

  const first = user.first_name ? String(user.first_name).trim()[0] : user.email ? String(user.email).trim()[0] : "F";
  const last = user.last_name ? String(user.last_name).trim()[0] : "";

  return `${first || "F"}${last}`.toUpperCase();
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    query.set(key, String(value));
  }

  const result = query.toString();
  return result ? `?${result}` : "";
}

module.exports = {
  buildQueryString,
  formatCurrency,
  formatDate,
  formatDateInput,
  formatPercent,
  getInitials,
  normalizeErrors,
  normalizeItem,
  normalizeList,
  parseBoolean,
  parseDate,
  parseInteger,
  parseMoney,
  removeUndefined,
};