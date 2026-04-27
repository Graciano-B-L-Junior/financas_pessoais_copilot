const { createApp } = require("./app");
const { port } = require("./config/env");

const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend rodando na porta ${port}`);
});