 const express = require("express");

const { sequelize } = require("./models");
const profileRoutes = require("./routes/profileRoutes");
const technologyRoutes = require("./routes/technologyRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevShowcase API está funcionando!"
  });
});

app.use("/api/profiles", profileRoutes);
app.use("/api/technologies", technologyRoutes);
app.use("/api/projects", projectRoutes);


app.use((req, res) => {
  res.status(404).json({
    message: "Rota não encontrada."
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("Banco de dados conectado.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco:", error);
    process.exit(1);
  });