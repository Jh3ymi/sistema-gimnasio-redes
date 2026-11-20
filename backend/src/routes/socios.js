const { Router } = require("express");
const pool = require("../db/pool");

const router = Router();

const CONSULTA_SOCIO = `
  SELECT s.id, s.carnet, s.nombres, s.apellidos, s.telefono, s.foto_url,
         p.nombre AS plan_nombre,
         m.fecha_fin,
         m.id AS membresia_id,
         GREATEST(p.precio - m.monto_pagado, 0) AS deuda
  FROM socios s
  LEFT JOIN LATERAL (
    SELECT * FROM membresias
    WHERE socio_id = s.id
    ORDER BY fecha_fin DESC LIMIT 1
  ) m ON TRUE
  LEFT JOIN planes p ON p.id = m.plan_id
  WHERE s.carnet = $1 AND s.activo;
`;

const CONSULTA_ULTIMOS_ACCESOS = `
  SELECT fecha_hora, resultado
  FROM asistencias
  WHERE socio_id = $1
  ORDER BY fecha_hora DESC
  LIMIT 5;
`;

router.get("/:ci", async (req, res, next) => {
  try {
    const { rows } = await pool.query(CONSULTA_SOCIO, [req.params.ci]);
    const socio = rows[0];
    if (!socio) {
      return res.status(404).json({ mensaje: "CI no registrado." });
    }

    const accesos = await pool.query(CONSULTA_ULTIMOS_ACCESOS, [socio.id]);

    res.json({
      ci: socio.carnet,
      nombre: `${socio.nombres} ${socio.apellidos}`,
      foto_url: socio.foto_url,
      plan: socio.plan_nombre,
      fecha_vencimiento: socio.fecha_fin,
      deuda: socio.deuda === null ? 0 : Number(socio.deuda),
      telefono: socio.telefono,
      ultimos_accesos: accesos.rows.map((a) => ({
        fecha_hora: a.fecha_hora,
        resultado: a.resultado.toLowerCase(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
