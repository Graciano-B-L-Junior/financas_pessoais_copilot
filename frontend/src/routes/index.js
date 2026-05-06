const express = require("express");

const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middlewares/session");
const pages = require("../controllers/pages");
const api = require("../lib/api");

const publicRouter = express.Router();
const appRouter = express.Router();

publicRouter.get("/", asyncHandler(pages.showLanding));
publicRouter.get("/login", asyncHandler(pages.showLogin));
publicRouter.post("/login", asyncHandler(pages.submitLogin));
publicRouter.get("/register", asyncHandler(pages.showRegister));
publicRouter.post("/register", asyncHandler(pages.submitRegister));
publicRouter.post("/logout", asyncHandler(pages.logout));

// API Routes — definidas antes do requireAuth para retornar JSON 401 em vez de redirecionar para HTML
appRouter.get("/api/dashboard/category-series/", asyncHandler(async (req, res) => {
  if (!res.locals.currentUser) {
    return res.status(401).json({ status: 401, status_text: "Unauthorized", category_series: [] });
  }
  const response = await api.request({
    method: "get",
    path: "/dashboard/category-series/",
    params: req.query,
    req,
    res,
  });
  return res.status(response.status).json(response.data);
}));

appRouter.use(requireAuth);

appRouter.get("/dashboard", asyncHandler(pages.showDashboard));

appRouter.get("/orcamento", asyncHandler(pages.showBudgets));
appRouter.post("/orcamento", asyncHandler(pages.createBudget));
appRouter.post("/orcamento/:id/finalizar", asyncHandler(pages.finalizeBudget));
appRouter.post("/orcamento/:id/excluir", asyncHandler(pages.deleteBudget));

appRouter.get("/categorias", asyncHandler(pages.showCategories));
appRouter.post("/categorias", asyncHandler(pages.createCategory));
appRouter.get("/categorias/:id/editar", asyncHandler(pages.showCategoryEdit));
appRouter.post("/categorias/:id/editar", asyncHandler(pages.updateCategory));
appRouter.post("/categorias/:id/status", asyncHandler(pages.toggleCategoryStatus));
appRouter.post("/categorias/:id/excluir", asyncHandler(pages.deleteCategory));

appRouter.get("/lancamentos", asyncHandler(pages.showTransactions));
appRouter.post("/lancamentos", asyncHandler(pages.createTransaction));
appRouter.get("/lancamentos/:id/editar", asyncHandler(pages.showTransactionEdit));
appRouter.post("/lancamentos/:id/editar", asyncHandler(pages.updateTransaction));
appRouter.post("/lancamentos/:id/excluir", asyncHandler(pages.deleteTransaction));

appRouter.get("/perfil", asyncHandler(pages.showProfile));
appRouter.post("/perfil", asyncHandler(pages.updateProfile));

appRouter.get("/analises", asyncHandler(pages.showAnalytics));

module.exports = {
  appRouter,
  publicRouter,
};