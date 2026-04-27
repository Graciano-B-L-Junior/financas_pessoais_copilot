const { cookieSecure } = require("../config/env");

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: cookieSecure,
};

const FLASH_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 1000 * 10,
};

function hasAuthCookies(req) {
  return Boolean(req.cookies?.access_token || req.cookies?.refresh_token);
}

function buildAuthCookieHeader(cookies = {}) {
  return ["access_token", "refresh_token"]
    .filter((name) => cookies?.[name])
    .map((name) => `${name}=${cookies[name]}`)
    .join("; ");
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  if (accessToken) {
    res.cookie("access_token", accessToken, AUTH_COOKIE_OPTIONS);
  }

  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, AUTH_COOKIE_OPTIONS);
  }
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

function setFlash(res, type, message) {
  res.cookie("flash_type", type, FLASH_COOKIE_OPTIONS);
  res.cookie("flash_message", message, FLASH_COOKIE_OPTIONS);
}

function consumeFlash(req, res) {
  const type = req.cookies?.flash_type;
  const message = req.cookies?.flash_message;

  if (type || message) {
    res.clearCookie("flash_type", { path: "/" });
    res.clearCookie("flash_message", { path: "/" });
  }

  if (!type && !message) {
    return null;
  }

  return {
    message: message || "",
    type: type || "info",
  };
}

module.exports = {
  AUTH_COOKIE_OPTIONS,
  FLASH_COOKIE_OPTIONS,
  buildAuthCookieHeader,
  clearAuthCookies,
  consumeFlash,
  hasAuthCookies,
  setAuthCookies,
  setFlash,
};