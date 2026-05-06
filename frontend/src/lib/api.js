const axios = require("axios");

const { backendApiUrl } = require("../config/env");
const { buildAuthCookieHeader, setAuthCookies } = require("./session");

const client = axios.create({
  baseURL: backendApiUrl,
  timeout: 15000,
  validateStatus: () => true,
});

function withCookieHeader(req, headers = {}) {
  const cookieHeader = buildAuthCookieHeader(req?.cookies || {});

  return cookieHeader ? { ...headers, Cookie: cookieHeader } : { ...headers };
}

function withAuthHeaders(req, headers = {}) {
  const mergedHeaders = withCookieHeader(req, headers);
  const accessToken = req?.cookies?.access_token;

  if (!accessToken) {
    return mergedHeaders;
  }

  return {
    ...mergedHeaders,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function refreshAccessToken(req, res) {
  if (!req?.cookies?.refresh_token) {
    return null;
  }

  const response = await client.post(
    "/auth/refresh/",
    { refresh: req.cookies.refresh_token },
    {
      headers: withAuthHeaders(req),
    },
  );

  if (response.status !== 200 || !response.data?.access) {
    return null;
  }

  req.cookies.access_token = response.data.access;
  if (res) {
    setAuthCookies(res, { accessToken: response.data.access, refreshToken: response.data.refresh });
  }

  return response.data.access;
}

async function request({ req, res, method, path, data, params, headers = {}, allowRefresh = true }) {
  const response = await client.request({
    data,
    headers: withAuthHeaders(req, headers),
    method,
    params,
    url: path,
  });

  if (response.status !== 401 || !allowRefresh) {
    return response;
  }

  const refreshedAccess = await refreshAccessToken(req, res);
  if (!refreshedAccess) {
    return response;
  }

  return client.request({
    data,
    headers: withAuthHeaders(req, {
      ...headers,
      Cookie: buildAuthCookieHeader(req.cookies || {}),
    }),
    method,
    params,
    url: path,
  });
}

function login(req, res, data) {
  return request({ allowRefresh: false, data, method: "post", path: "/auth/login/", req, res });
}

function register(req, res, data) {
  return request({ allowRefresh: false, data, method: "post", path: "/auth/register/", req, res });
}

function logout(req, res, data) {
  return request({ allowRefresh: false, data, method: "post", path: "/auth/logout/", req, res });
}

function profileGet(req, res) {
  return request({ method: "get", path: "/profile/", req, res });
}

function profileUpdate(req, res, data) {
  return request({ data, method: "patch", path: "/profile/", req, res });
}

function dashboardGet(req, res, params) {
  return request({ method: "get", params, path: "/dashboard/", req, res });
}

function analyticsGet(req, res, params) {
  return request({ method: "get", params, path: "/analytics/profile/", req, res });
}

function categoriesList(req, res, params) {
  return request({ method: "get", params, path: "/categories/", req, res });
}

function categoriesCreate(req, res, data) {
  return request({ data, method: "post", path: "/categories/", req, res });
}

function categoriesRetrieve(req, res, id) {
  return request({ method: "get", path: `/categories/${id}/`, req, res });
}

function categoriesUpdate(req, res, id, data) {
  return request({ data, method: "patch", path: `/categories/${id}/`, req, res });
}

function categoriesDelete(req, res, id) {
  return request({ method: "delete", path: `/categories/${id}/`, req, res });
}

function budgetsList(req, res, params) {
  return request({ method: "get", params, path: "/budgets/", req, res });
}

function budgetsCreate(req, res, data) {
  return request({ data, method: "post", path: "/budgets/", req, res });
}

function budgetsRetrieve(req, res, id) {
  return request({ method: "get", path: `/budgets/${id}/`, req, res });
}

function budgetsFinalize(req, res, id) {
  return request({ method: "post", path: `/budgets/${id}/finalize/`, req, res });
}

function budgetsDelete(req, res, id) {
  return request({ method: "delete", path: `/budgets/${id}/`, req, res });
}

function transactionsList(req, res, params) {
  return request({ method: "get", params, path: "/transactions/", req, res });
}

function transactionsCreate(req, res, data) {
  return request({ data, method: "post", path: "/transactions/", req, res });
}

function transactionsRetrieve(req, res, id) {
  return request({ method: "get", path: `/transactions/${id}/`, req, res });
}

function transactionsUpdate(req, res, id, data) {
  return request({ data, method: "patch", path: `/transactions/${id}/`, req, res });
}

function transactionsDelete(req, res, id) {
  return request({ method: "delete", path: `/transactions/${id}/`, req, res });
}

module.exports = {
  analyticsGet,
  categoriesCreate,
  categoriesDelete,
  categoriesList,
  categoriesRetrieve,
  categoriesUpdate,
  budgetsCreate,
  budgetsDelete,
  budgetsFinalize,
  budgetsList,
  budgetsRetrieve,
  client,
  dashboardGet,
  login,
  logout,
  profileGet,
  profileUpdate,
  register,
  request,
  refreshAccessToken,
  transactionsCreate,
  transactionsDelete,
  transactionsList,
  transactionsRetrieve,
  transactionsUpdate,
  withAuthHeaders,
};