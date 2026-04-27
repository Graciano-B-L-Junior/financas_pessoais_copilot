const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "src", "public");
const viewsDir = path.join(rootDir, "src", "views");
const distDir = path.join(rootDir, "dist");
const distPublicDir = path.join(distDir, "public");

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Estrutura obrigatoria ausente: ${label}`);
  }
}

assertExists(publicDir, "src/public");
assertExists(viewsDir, "src/views");

fs.mkdirSync(distDir, { recursive: true });
fs.rmSync(distPublicDir, { recursive: true, force: true });
fs.cpSync(publicDir, distPublicDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, "build.json"),
  JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      publicAssets: true,
    },
    null,
    2,
  ),
);

console.log("Frontend build concluido com sucesso.");