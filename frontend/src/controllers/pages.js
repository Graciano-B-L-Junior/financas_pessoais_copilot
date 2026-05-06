const api = require("../lib/api");
const {
  formatDateInput,
  normalizeErrors,
  normalizeItem,
  normalizeList,
  buildQueryString,
  parseBoolean,
  parseDate,
  parseInteger,
  parseMoney,
  removeUndefined,
} = require("../lib/view");
const { clearAuthCookies, setAuthCookies, setFlash } = require("../lib/session");

function redirectLogin(res, nextPath, message = "Sua sessao expirou. Faça login novamente.") {
  clearAuthCookies(res);
  setFlash(res, "warning", message);
  return res.redirect(303, `/login?next=${encodeURIComponent(nextPath || "/dashboard")}`);
}

function dashboardQuery(query = {}) {
  return removeUndefined({
    category: query.category || undefined,
    end: query.end || undefined,
    is_recurring: query.is_recurring || undefined,
    max_amount: query.max_amount || undefined,
    min_amount: query.min_amount || undefined,
    start: query.start || undefined,
    type: query.type || undefined,
  });
}

function budgetsQuery(query = {}) {
  return removeUndefined({
    month: query.month || undefined,
    status: query.status || undefined,
  });
}

function analyticsQuery(query = {}) {
  return removeUndefined({
    end: query.end || undefined,
    start: query.start || undefined,
  });
}

function categoryFilters(query = {}) {
  return removeUndefined({
    is_active: query.is_active || undefined,
    type: query.type || undefined,
  });
}

function transactionsFilters(query = {}) {
  return removeUndefined({
    category: query.category || undefined,
    end: query.end || undefined,
    is_recurring: query.is_recurring || undefined,
    start: query.start || undefined,
    type: query.type || undefined,
  });
}

function buildCategoryPayload(body = {}) {
  return removeUndefined({
    description: typeof body.description === "string" ? body.description.trim() : "",
    is_active: body.is_active === undefined ? true : parseBoolean(body.is_active, true),
    name: typeof body.name === "string" ? body.name.trim() : body.name,
    type: body.type,
  });
}

function buildTransactionPayload(body = {}) {
  return removeUndefined({
    amount: parseMoney(body.amount),
    category: parseInteger(body.category),
    date: parseDate(body.date),
    description: typeof body.description === "string" ? body.description.trim() : body.description,
    end_date: parseDate(body.end_date),
    frequency: typeof body.frequency === "string" ? body.frequency.trim() : body.frequency,
    is_recurring: parseBoolean(body.is_recurring, false),
    start_date: parseDate(body.start_date),
    type: body.type,
  });
}

function buildProfilePayload(body = {}) {
  return removeUndefined({
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
    first_name: typeof body.first_name === "string" ? body.first_name.trim() : body.first_name,
    last_name: typeof body.last_name === "string" ? body.last_name.trim() : body.last_name,
  });
}

function dashboardRecentTransactions(transactions = []) {
  return transactions.slice(0, 6);
}

function currentMonthInput() {
  return new Date().toISOString().slice(0, 7);
}

function defaultBudgetRows(count = 4) {
  return Array.from({ length: count }, () => ({
    category_id: "",
    budgeted_amount: "",
  }));
}

function budgetRowsFromBody(bodyCategories = []) {
  const rows = Array.isArray(bodyCategories) ? bodyCategories : Object.values(bodyCategories || {});

  return rows
    .map((item) => ({
      category_id: item?.category_id ?? "",
      budgeted_amount: item?.budgeted_amount ?? "",
    }))
    .filter((item) => item.category_id !== "" || item.budgeted_amount !== "");
}

function buildBudgetPayload(body = {}) {
  return removeUndefined({
    categories: budgetRowsFromBody(body.categories)
      .map((item) => removeUndefined({
        budgeted_amount: parseMoney(item.budgeted_amount),
        category_id: parseInteger(item.category_id),
      })),
    month: typeof body.month === "string" ? body.month.trim() : body.month,
    total_amount: parseMoney(body.total_amount),
  });
}

function budgetFormValues(body = {}) {
  const categories = budgetRowsFromBody(body.categories);

  return {
    categories: categories.length ? categories : defaultBudgetRows(),
    month: typeof body.month === "string" && body.month ? body.month : currentMonthInput(),
    total_amount: typeof body.total_amount === "string" ? body.total_amount : body.total_amount || "",
  };
}

function extractCategoryOptions(categories = []) {
  return categories.map((category) => ({
    ...category,
    label: category.is_active ? category.name : `${category.name} (inativa)`,
  }));
}

async function showLanding(req, res) {
  return res.render("landing", {
    pageTitle: "Visão geral",
    subtitle: "Controle financeiro com dashboard, lançamentos e análises em um unico lugar.",
  });
}

async function showLogin(req, res) {
  if (res.locals.currentUser) {
    return res.redirect(303, "/dashboard");
  }

  return res.render("login", {
    errors: {},
    next: req.query.next || "/dashboard",
    pageTitle: "Entrar",
    values: { email: "" },
  });
}

async function submitLogin(req, res) {
  const nextPath = req.body.next || "/dashboard";
  const payload = {
    email: req.body.email,
    password: req.body.password,
  };

  const response = await api.login(req, res, payload);

  if (response.status === 200 && response.data?.access) {
    setAuthCookies(res, {
      accessToken: response.data.access,
      refreshToken: response.data.refresh,
    });
    setFlash(res, "success", "Bem-vindo. Sua sessão foi iniciada com sucesso.");
    return res.redirect(303, nextPath || "/dashboard");
  }

  if ([400, 401].includes(response.status)) {
    return res.status(400).render("login", {
      errors: normalizeErrors(response.data),
      next: nextPath,
      pageTitle: "Entrar",
      values: { email: req.body.email || "" },
    });
  }

  return res.status(502).render("error", {
    message: "Nao foi possivel entrar agora. Tente novamente em instantes.",
    pageTitle: "Erro ao entrar",
  });
}

async function showRegister(req, res) {
  if (res.locals.currentUser) {
    return res.redirect(303, "/dashboard");
  }

  return res.render("register", {
    errors: {},
    pageTitle: "Criar conta",
    values: {
      email: "",
      first_name: "",
      last_name: "",
    },
  });
}

async function submitRegister(req, res) {
  const payload = buildProfilePayload(req.body);
  payload.password = req.body.password;

  const response = await api.register(req, res, payload);

  if (response.status === 201) {
    setFlash(res, "success", "Cadastro realizado com sucesso. Faça login para continuar.");
    return res.redirect(303, "/login");
  }

  if (response.status === 400) {
    return res.status(400).render("register", {
      errors: normalizeErrors(response.data),
      pageTitle: "Criar conta",
      values: {
        email: req.body.email || "",
        first_name: req.body.first_name || "",
        last_name: req.body.last_name || "",
      },
    });
  }

  return res.status(502).render("error", {
    message: "Nao foi possivel concluir o cadastro agora.",
    pageTitle: "Erro ao cadastrar",
  });
}

async function logout(req, res) {
  await api.logout(req, res, { refresh: req.cookies?.refresh_token });
  clearAuthCookies(res);
  setFlash(res, "info", "Voce saiu da plataforma com sucesso.");
  return res.redirect(303, "/login");
}

async function showDashboard(req, res) {
  const query = dashboardQuery(req.query);
  const [dashboardResponse, categoriesResponse, transactionsResponse] = await Promise.all([
    api.dashboardGet(req, res, query),
    api.categoriesList(req, res, {}),
    api.transactionsList(req, res, query),
  ]);

  if ([401, 403].includes(dashboardResponse.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (dashboardResponse.status >= 500) {
    return res.status(502).render("error", {
      message: "Nao foi possivel carregar o dashboard agora.",
      pageTitle: "Dashboard indisponivel",
    });
  }

  const dashboard = normalizeItem(dashboardResponse.data);
  const categories = extractCategoryOptions(normalizeList(categoriesResponse.data));
  const transactions = dashboardRecentTransactions(normalizeList(transactionsResponse.data));

  return res.render("dashboard", {
    categories,
    dashboard,
    filters: query,
    pageTitle: "Dashboard",
    recentTransactions: transactions,
  });
}

async function showBudgets(req, res) {
  const filters = budgetsQuery(req.query);
  const [budgetsResponse, expenseCategoriesResponse] = await Promise.all([
    api.budgetsList(req, res, filters),
    api.categoriesList(req, res, { is_active: true, type: "despesa" }),
  ]);

  if ([401, 403].includes(budgetsResponse.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (budgetsResponse.status >= 500) {
    return res.status(502).render("error", {
      message: "Nao foi possivel carregar os orçamentos agora.",
      pageTitle: "Orçamentos indisponiveis",
    });
  }

  const budgets = normalizeList(budgetsResponse.data);
  const selectedBudgetId = req.query.budget || budgets[0]?.id;
  let selectedBudget = null;

  if (selectedBudgetId) {
    const selectedResponse = await api.budgetsRetrieve(req, res, selectedBudgetId);

    if ([401, 403].includes(selectedResponse.status)) {
      return redirectLogin(res, req.originalUrl);
    }

    if (selectedResponse.status === 404) {
      return res.status(404).render("not-found", {
        message: "O orçamento solicitado nao foi encontrado.",
        pageTitle: "Orçamento nao encontrado",
      });
    }

    selectedBudget = normalizeItem(selectedResponse.data);
  }

  return res.render("budgets", {
    budgets,
    categories: extractCategoryOptions(normalizeList(expenseCategoriesResponse.data)),
    errors: {},
    filters,
    pageTitle: "Orçamento",
    selectedBudget,
    values: budgetFormValues(req.body || {}),
  });
}

async function showBudgetsWithFormError(req, res, response) {
  const filters = budgetsQuery(req.query);
  const [budgetsResponse, expenseCategoriesResponse] = await Promise.all([
    api.budgetsList(req, res, filters),
    api.categoriesList(req, res, { is_active: true, type: "despesa" }),
  ]);

  const budgets = normalizeList(budgetsResponse.data);
  const selectedBudgetId = req.query.budget || budgets[0]?.id;
  let selectedBudget = null;

  if (selectedBudgetId) {
    const selectedResponse = await api.budgetsRetrieve(req, res, selectedBudgetId);
    if (selectedResponse.status === 200) {
      selectedBudget = normalizeItem(selectedResponse.data);
    }
  }

  return res.status(400).render("budgets", {
    budgets,
    categories: extractCategoryOptions(normalizeList(expenseCategoriesResponse.data)),
    errors: normalizeErrors(response.data),
    filters,
    pageTitle: "Orçamento",
    selectedBudget,
    values: budgetFormValues(req.body || {}),
  });
}

async function createBudget(req, res) {
  const response = await api.budgetsCreate(req, res, buildBudgetPayload(req.body));

  if (response.status === 201) {
    const budget = normalizeItem(response.data);
    setFlash(res, "success", "Orçamento cadastrado com sucesso.");
    return res.redirect(303, `/orcamento?budget=${budget.id}`);
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  return showBudgetsWithFormError(req, res, response);
}

async function finalizeBudget(req, res) {
  const response = await api.budgetsFinalize(req, res, req.params.id);

  if (response.status === 200) {
    setFlash(res, "success", "Orçamento finalizado com sucesso.");
    return res.redirect(303, `/orcamento?budget=${req.params.id}`);
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "O orçamento solicitado nao foi encontrado.",
      pageTitle: "Orçamento nao encontrado",
    });
  }

  setFlash(res, "warning", response.data?.message || "Nao foi possivel finalizar o orçamento.");
  return res.redirect(303, "/orcamento");
}

async function deleteBudget(req, res) {
  const response = await api.budgetsDelete(req, res, req.params.id);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "O orçamento solicitado nao foi encontrado.",
      pageTitle: "Orçamento nao encontrado",
    });
  }

  if (response.status === 400) {
    setFlash(res, "warning", response.data?.message || "Nao foi possivel excluir o orçamento.");
    return res.redirect(303, "/orcamento");
  }

  setFlash(res, "info", "Orçamento removido com sucesso.");
  return res.redirect(303, "/orcamento");
}

async function showCategories(req, res) {
  const filters = categoryFilters(req.query);
  const response = await api.categoriesList(req, res, filters);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status >= 500) {
    return res.status(502).render("error", {
      message: "Nao foi possivel carregar as categorias agora.",
      pageTitle: "Categorias indisponiveis",
    });
  }

  return res.render("categories", {
    errors: {},
    filters,
    pageTitle: "Categorias",
    values: {
      description: "",
      is_active: true,
      name: "",
      type: "despesa",
    },
    categories: normalizeList(response.data),
  });
}

async function createCategory(req, res) {
  const response = await api.categoriesCreate(req, res, buildCategoryPayload(req.body));

  if (response.status === 201) {
    setFlash(res, "success", "Categoria cadastrada com sucesso.");
    return res.redirect(303, "/categorias");
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  return showCategoriesWithFormError(req, res, response);
}

async function showCategoriesWithFormError(req, res, response) {
  const filters = categoryFilters(req.query);
  const categoriesResponse = await api.categoriesList(req, res, filters);

  return res.status(400).render("categories", {
    categories: normalizeList(categoriesResponse.data),
    errors: normalizeErrors(response.data),
    filters,
    pageTitle: "Categorias",
    values: {
      description: req.body.description || "",
      is_active: parseBoolean(req.body.is_active, true),
      name: req.body.name || "",
      type: req.body.type || "despesa",
    },
  });
}

async function showCategoryEdit(req, res) {
  const response = await api.categoriesRetrieve(req, res, req.params.id);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "A categoria solicitada nao foi encontrada.",
      pageTitle: "Categoria nao encontrada",
    });
  }

  const category = normalizeItem(response.data);

  return res.render("category-form", {
    category,
    errors: {},
    pageTitle: "Editar categoria",
    values: {
      description: category.description || "",
      is_active: category.is_active !== undefined ? category.is_active : true,
      name: category.name || "",
      type: category.type || "despesa",
    },
  });
}

async function updateCategory(req, res) {
  const response = await api.categoriesUpdate(req, res, req.params.id, buildCategoryPayload(req.body));

  if (response.status === 200) {
    setFlash(res, "success", "Categoria atualizada com sucesso.");
    return res.redirect(303, "/categorias");
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "A categoria solicitada nao foi encontrada.",
      pageTitle: "Categoria nao encontrada",
    });
  }

  const category = normalizeItem((await api.categoriesRetrieve(req, res, req.params.id)).data);

  return res.status(400).render("category-form", {
    category,
    errors: normalizeErrors(response.data),
    pageTitle: "Editar categoria",
    values: {
      description: req.body.description || "",
      is_active: parseBoolean(req.body.is_active, true),
      name: req.body.name || "",
      type: req.body.type || "despesa",
    },
  });
}

async function toggleCategoryStatus(req, res) {
  const response = await api.categoriesUpdate(req, res, req.params.id, {
    is_active: parseBoolean(req.body.is_active, true),
  });

  if (response.status === 200) {
    setFlash(res, "success", "Status da categoria atualizado.");
  } else if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  } else if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "A categoria solicitada nao foi encontrada.",
      pageTitle: "Categoria nao encontrada",
    });
  }

  return res.redirect(303, "/categorias");
}

async function deleteCategory(req, res) {
  const response = await api.categoriesDelete(req, res, req.params.id);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "A categoria solicitada nao foi encontrada.",
      pageTitle: "Categoria nao encontrada",
    });
  }

  setFlash(res, "info", "Categoria removida com sucesso.");
  return res.redirect(303, "/categorias");
}

async function showTransactions(req, res) {
  const filters = transactionsFilters(req.query);
  const [transactionsResponse, allCategoriesResponse, activeCategoriesResponse] = await Promise.all([
    api.transactionsList(req, res, filters),
    api.categoriesList(req, res, {}),
    api.categoriesList(req, res, { is_active: true }),
  ]);

  if ([401, 403].includes(transactionsResponse.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (transactionsResponse.status >= 500) {
    return res.status(502).render("error", {
      message: "Nao foi possivel carregar os lancamentos agora.",
      pageTitle: "Lancamentos indisponiveis",
    });
  }

  const meta = transactionsResponse.data || {};
  const count = Number(meta.count) || 0;
  const page = Number(req.query.page) || 1;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pagination = {
    count,
    page,
    pageSize,
    totalPages,
    hasNext: !!meta.next,
    hasPrevious: !!meta.previous,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };

  const baseQuery = buildQueryString(filters);

  return res.render("transactions", {
    activeCategories: extractCategoryOptions(normalizeList(activeCategoriesResponse.data)),
    categories: extractCategoryOptions(normalizeList(allCategoriesResponse.data)),
    errors: {},
    filters,
    pageTitle: "Lancamentos",
    transactions: normalizeList(transactionsResponse.data),
    pagination,
    baseQuery,
    values: {
      amount: "",
      category: "",
      date: formatDateInput(new Date()),
      description: "",
      end_date: "",
      frequency: "",
      is_active: true,
      is_recurring: false,
      start_date: "",
      type: "despesa",
    },
  });
}

async function createTransaction(req, res) {
  const response = await api.transactionsCreate(req, res, buildTransactionPayload(req.body));

  if (response.status === 201) {
    setFlash(res, "success", "Lancamento cadastrado com sucesso.");
    return res.redirect(303, "/lancamentos");
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  return showTransactionsWithFormError(req, res, response);
}

async function showTransactionsWithFormError(req, res, response) {
  const filters = transactionsFilters(req.query);
  const [transactionsResponse, allCategoriesResponse, activeCategoriesResponse] = await Promise.all([
    api.transactionsList(req, res, filters),
    api.categoriesList(req, res, {}),
    api.categoriesList(req, res, { is_active: true }),
  ]);

  const meta = transactionsResponse.data || {};
  const count = Number(meta.count) || 0;
  const page = Number(req.query.page) || 1;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pagination = {
    count,
    page,
    pageSize,
    totalPages,
    hasNext: !!meta.next,
    hasPrevious: !!meta.previous,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };

  const baseQuery = buildQueryString(filters);

  return res.status(400).render("transactions", {
    activeCategories: extractCategoryOptions(normalizeList(activeCategoriesResponse.data)),
    categories: extractCategoryOptions(normalizeList(allCategoriesResponse.data)),
    errors: normalizeErrors(response.data),
    filters,
    pageTitle: "Lancamentos",
    transactions: normalizeList(transactionsResponse.data),
    pagination,
    baseQuery,
    values: {
      amount: req.body.amount || "",
      category: req.body.category || "",
      date: req.body.date || formatDateInput(new Date()),
      description: req.body.description || "",
      end_date: req.body.end_date || "",
      frequency: req.body.frequency || "",
      is_active: parseBoolean(req.body.is_active, true),
      is_recurring: parseBoolean(req.body.is_recurring, false),
      start_date: req.body.start_date || "",
      type: req.body.type || "despesa",
    },
  });
}

async function showTransactionEdit(req, res) {
  const [transactionResponse, categoriesResponse] = await Promise.all([
    api.transactionsRetrieve(req, res, req.params.id),
    api.categoriesList(req, res, {}),
  ]);

  if ([401, 403].includes(transactionResponse.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (transactionResponse.status === 404) {
    return res.status(404).render("not-found", {
      message: "O lancamento solicitado nao foi encontrado.",
      pageTitle: "Lancamento nao encontrado",
    });
  }

  const transaction = normalizeItem(transactionResponse.data);

  return res.render("transaction-form", {
    categories: extractCategoryOptions(normalizeList(categoriesResponse.data)),
    errors: {},
    pageTitle: "Editar lancamento",
    transaction,
    values: {
      amount: transaction.amount || "",
      category: transaction.category || "",
      date: formatDateInput(transaction.date),
      description: transaction.description || "",
      end_date: formatDateInput(transaction.end_date),
      frequency: transaction.frequency || "",
      is_active: transaction.is_active !== undefined ? transaction.is_active : true,
      is_recurring: transaction.is_recurring || false,
      start_date: formatDateInput(transaction.start_date),
      type: transaction.type || "despesa",
    },
  });
}

async function updateTransaction(req, res) {
  const response = await api.transactionsUpdate(req, res, req.params.id, buildTransactionPayload(req.body));

  if (response.status === 200) {
    setFlash(res, "success", "Lancamento atualizado com sucesso.");
    return res.redirect(303, "/lancamentos");
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "O lancamento solicitado nao foi encontrado.",
      pageTitle: "Lancamento nao encontrado",
    });
  }

  const [transactionResponse, categoriesResponse] = await Promise.all([
    api.transactionsRetrieve(req, res, req.params.id),
    api.categoriesList(req, res, {}),
  ]);
  const transaction = normalizeItem(transactionResponse.data);

  return res.status(400).render("transaction-form", {
    categories: extractCategoryOptions(normalizeList(categoriesResponse.data)),
    errors: normalizeErrors(response.data),
    pageTitle: "Editar lancamento",
    transaction,
    values: {
      amount: req.body.amount || "",
      category: req.body.category || "",
      date: req.body.date || formatDateInput(transaction.date),
      description: req.body.description || "",
      end_date: req.body.end_date || "",
      frequency: req.body.frequency || "",
      is_active: parseBoolean(req.body.is_active, true),
      is_recurring: parseBoolean(req.body.is_recurring, false),
      start_date: req.body.start_date || "",
      type: req.body.type || "despesa",
    },
  });
}

async function deleteTransaction(req, res) {
  const response = await api.transactionsDelete(req, res, req.params.id);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status === 404) {
    return res.status(404).render("not-found", {
      message: "O lancamento solicitado nao foi encontrado.",
      pageTitle: "Lancamento nao encontrado",
    });
  }

  setFlash(res, "info", "Lancamento removido com sucesso.");
  return res.redirect(303, "/lancamentos");
}

async function showProfile(req, res) {
  return res.render("profile", {
    errors: {},
    pageTitle: "Perfil",
    values: req.currentUser || res.locals.currentUser || {},
  });
}

async function updateProfile(req, res) {
  const response = await api.profileUpdate(req, res, buildProfilePayload(req.body));

  if (response.status === 200) {
    setFlash(res, "success", "Perfil atualizado com sucesso.");
    return res.redirect(303, "/perfil");
  }

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  return res.status(400).render("profile", {
    errors: normalizeErrors(response.data),
    pageTitle: "Perfil",
    values: {
      email: req.body.email || "",
      first_name: req.body.first_name || "",
      last_name: req.body.last_name || "",
    },
  });
}

async function showAnalytics(req, res) {
  const filters = analyticsQuery(req.query);
  const response = await api.analyticsGet(req, res, filters);

  if ([401, 403].includes(response.status)) {
    return redirectLogin(res, req.originalUrl);
  }

  if (response.status >= 500) {
    return res.status(502).render("error", {
      message: "Nao foi possivel carregar as analises agora.",
      pageTitle: "Analises indisponiveis",
    });
  }

  return res.render("analytics", {
    analytics: normalizeItem(response.data),
    errors: {},
    filters,
    pageTitle: "Analises",
  });
}

module.exports = {
  buildCategoryPayload,
  buildBudgetPayload,
  buildProfilePayload,
  buildTransactionPayload,
  createCategory,
  createBudget,
  createTransaction,
  deleteCategory,
  deleteBudget,
  deleteTransaction,
  logout,
  redirectLogin,
  finalizeBudget,
  showBudgets,
  showAnalytics,
  showCategories,
  showCategoryEdit,
  showDashboard,
  showLanding,
  showLogin,
  showProfile,
  showRegister,
  showTransactionEdit,
  showTransactions,
  submitLogin,
  submitRegister,
  toggleCategoryStatus,
  updateCategory,
  updateProfile,
  updateTransaction,
};