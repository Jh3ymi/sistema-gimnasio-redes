const { Router } = require("express");
const pool = require("../db/pool");

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, categoria, precio, stock
       FROM productos
       WHERE activo
       ORDER BY categoria, nombre`
    );
    res.json(
      rows.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        categoria: p.categoria,
        stock: p.stock,
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
