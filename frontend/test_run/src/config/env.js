require("dotenv").config();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

module.exports = {
  appName: process.env.APP_NAME || "Financas Pessoais",
  backendApiUrl: process.env.BACKEND_API_URL || "http://localhost:8000/api/v1",
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, false),
  currency: process.env.CURRENCY || "BRL",
  locale: process.env.LOCALE || "pt-BR",
  logLevel: process.env.LOG_LEVEL || "info",
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
};