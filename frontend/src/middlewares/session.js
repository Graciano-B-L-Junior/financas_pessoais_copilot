const api = require("../lib/api");
const { clearAuthCookies, hasAuthCookies, setFlash } = require("../lib/session");
const { normalizeItem } = require("../lib/view");

async function resolveSession(req, res) {
  if (!hasAuthCookies(req)) {
    return { status: "missing", user: null };
  }

  const response = await api.profileGet(req, res);

  if (response.status === 200) {
    const user = normalizeItem(response.data);
    req.currentUser = user;
    res.locals.currentUser = user;
    res.locals.isAuthenticated = true;
    return { status: 200, user };
  }

  if ([401, 403].includes(response.status)) {
    clearAuthCookies(res);
  }

  return { status: response.status, user: null };
}

async function optionalSession(req, res, next) {
  try {
    const result = await resolveSession(req, res);
    if (result.user) {
      return next();
    }

    res.locals.currentUser = null;
    res.locals.isAuthenticated = false;
    return next();
  } catch {
    res.locals.currentUser = null;
    res.locals.isAuthenticated = false;
    return next();
  }
}

async function requireAuth(req, res, next) {
  try {
    if (res.locals.currentUser) {
      return next();
    }

    const result = await resolveSession(req, res);
    if (result.user) {
      return next();
    }

    if (result.status >= 500) {
      return next(new Error("Nao foi possivel validar sua sessao no momento."));
    }

    clearAuthCookies(res);
    setFlash(res, "warning", "Sua sessao expirou. Faça login novamente.");
    return res.redirect(303, `/login?next=${encodeURIComponent(req.originalUrl)}`);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  optionalSession,
  requireAuth,
  resolveSession,
};