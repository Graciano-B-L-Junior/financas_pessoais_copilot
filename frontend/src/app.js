const cookieParser = require("cookie-parser");
const express = require("express");
const morgan = require("morgan");
const path = require("path");

const { appName, nodeEnv } = require("./config/env");
const { optionalSession } = require("./middlewares/session");
const { appRouter, publicRouter } = require("./routes");
const {
  formatCurrency,
  formatDate,
  formatDateInput,
  formatPercent,
  getInitials,
} = require("./lib/view");
const { consumeFlash } = require("./lib/session");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.set("view cache", nodeEnv === "production");

  app.locals.appName = appName;
  app.locals.formatCurrency = formatCurrency;
  app.locals.formatDate = formatDate;
  app.locals.formatDateInput = formatDateInput;
  app.locals.formatPercent = formatPercent;
  app.locals.getInitials = getInitials;
  app.locals.isActivePath = (currentPath, targetPath) => currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);

  app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public"), { maxAge: nodeEnv === "production" ? "1d" : 0 }));

  app.use((req, res, next) => {
    res.locals.appName = appName;
    res.locals.currentPath = req.path;
    res.locals.currentUser = null;
    res.locals.flash = consumeFlash(req, res);
    res.locals.isAuthenticated = false;
    next();
  });

  app.get("/health", (req, res) => {
    res.json({
      service: appName,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use(optionalSession);
  app.use(publicRouter);
  app.use(appRouter);

  app.use((req, res) => {
    res.status(404).render("not-found", {
      message: "A pagina solicitada nao existe.",
      pageTitle: "Pagina nao encontrada",
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    console.error(error);

    return res.status(500).render("error", {
      message: error.message || "Ocorreu um erro inesperado.",
      pageTitle: "Erro interno",
    });
  });

  return app;
}

module.exports = { createApp };