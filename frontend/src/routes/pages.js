const express = require("express");

const api = require("../services/api");

const router = express.Router();

function renderPage(res, view, extra = {}) {
  return res.render(view, {
    title: extra.title || "Financas Pessoais",
    error: extra.error || null,
    data: extra.data || null,
  });
}

router.get("/", (req, res) => renderPage(res, "home", { title: "Landing" }));
router.get("/login", (req, res) => renderPage(res, "login", { title: "Login" }));
router.get("/dashboard", async (req, res) => {
  try {
    const response = await api.get("/dashboard/");
    return renderPage(res, "dashboard", { title: "Dashboard", data: response.data });
  } catch (error) {
    return renderPage(res, "dashboard", { title: "Dashboard", error: "Nao foi possivel carregar o dashboard." });
  }
});

router.get("/categorias", async (req, res) => {
  try {
    const response = await api.get("/categories/");
    return renderPage(res, "categories", { title: "Categorias", data: response.data });
  } catch (error) {
    return renderPage(res, "categories", { title: "Categorias", error: "Nao foi possivel carregar as categorias." });
  }
});

router.get("/lancamentos", async (req, res) => {
  try {
    const response = await api.get("/transactions/");
    return renderPage(res, "transactions", { title: "Lancamentos", data: response.data });
  } catch (error) {
    return renderPage(res, "transactions", { title: "Lancamentos", error: "Nao foi possivel carregar os lancamentos." });
  }
});

router.get("/perfil", async (req, res) => {
  try {
    const response = await api.get("/profile/");
    return renderPage(res, "profile", { title: "Perfil", data: response.data });
  } catch (error) {
    return renderPage(res, "profile", { title: "Perfil", error: "Nao foi possivel carregar o perfil." });
  }
});

router.get("/analises", async (req, res) => {
  try {
    const response = await api.get("/analytics/profile/");
    return renderPage(res, "analytics", { title: "Analise de Perfil", data: response.data });
  } catch (error) {
    return renderPage(res, "analytics", { title: "Analise de Perfil", error: "Nao foi possivel carregar a analise." });
  }
});

module.exports = router;