const express = require("express");

const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middlewares/session");
const pages = require("../controllers/pages");

const publicRouter = express.Router();
const appRouter = express.Router();

publicRouter.get("/", asyncHandler(pages.showLanding));
publicRouter.get("/login", asyncHandler(pages.showLogin));
publicRouter.post("/login", asyncHandler(pages.submitLogin));
publicRouter.get("/register", asyncHandler(pages.showRegister));
publicRouter.post("/register", asyncHandler(pages.submitRegister));
publicRouter.post("/logout", asyncHandler(pages.logout));

appRouter.use(requireAuth);

appRouter.get("/dashboard", asyncHandler(pages.showDashboard));

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