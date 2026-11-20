const { Router } = require("express");
const pool = require("../db/pool");

const router = Router();

// GET /api/planes — catálogo de planes para el selector del flujo de
// "cobrar / renovar membresía" en el frontend de recepción.
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, duracion_dias, precio
       FROM planes
       WHERE activo
       ORDER BY duracion_dias`
    );
    res.json(
      rows.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        duracion_dias: p.duracion_dias,
        precio: Number(p.precio),
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
