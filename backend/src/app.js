const express = require("express");
const cors = require("cors");

const sociosRouter = require("./routes/socios");
const accesosRouter = require("./routes/accesos");
const productosRouter = require("./routes/productos");
const ventasRouter = require("./routes/ventas");
const membresiasRouter = require("./routes/membresias");
const planesRouter = require("./routes/planes");
const cajaRouter = require("./routes/caja");

const app = express();

const origenesPermitidos = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: origenesPermitidos.includes("*") ? true : origenesPermitidos,
  })
);
app.use(express.json());

app.get("/", (_req, res) => res.json({ servicio: "GymControl API", estado: "ok" }));

app.use("/api/socios", sociosRouter);
app.use("/api/accesos", accesosRouter);
app.use("/api/productos", productosRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/membresias", membresiasRouter);
app.use("/api/planes", planesRouter);
app.use("/api/caja", cajaRouter);

app.use((_req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ mensaje: err.message || "Error interno." });
});

module.exports = app;
