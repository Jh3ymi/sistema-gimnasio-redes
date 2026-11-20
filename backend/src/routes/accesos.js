const { Router } = require("express");
const pool = require("../db/pool");
const { obtenerUsuarioSistemaId } = require("../services/contexto");

const router = Router();

const RESULTADOS_VALIDOS = new Set(["permitido", "denegado"]);

router.post("/", async (req, res, next) => {
  try {
    const { ci, resultado, motivo } = req.body || {};

    if (!ci || !RESULTADOS_VALIDOS.has(resultado)) {
      return res.status(400).json({
        mensaje: "Se requiere 'ci' y 'resultado' ('permitido' | 'denegado').",
      });
    }

    const socio = await pool.query(
      "SELECT id FROM socios WHERE carnet = $1 AND activo",
      [ci]
    );
    if (socio.rows.length === 0) {
      return res.status(404).json({ mensaje: "CI no registrado." });
    }
    const socioId = socio.rows[0].id;

    const membresia = await pool.query(
      "SELECT id FROM membresias WHERE socio_id = $1 ORDER BY fecha_fin DESC LIMIT 1",
      [socioId]
    );
    const membresiaId = membresia.rows[0]?.id ?? null;

    const usuarioId = await obtenerUsuarioSistemaId(pool);

    const insertado = await pool.query(
      `INSERT INTO asistencias (socio_id, usuario_id, membresia_id, resultado, motivo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fecha_hora, resultado, motivo`,
      [socioId, usuarioId, membresiaId, resultado.toUpperCase(), motivo || null]
    );

    const fila = insertado.rows[0];
    res.status(201).json({
      id: fila.id,
      ci,
      fecha_hora: fila.fecha_hora,
      resultado: fila.resultado.toLowerCase(),
      motivo: fila.motivo,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
