const { Router } = require("express");
const pool = require("../db/pool");
const {
  obtenerUsuarioSistemaId,
  obtenerTurnoAbiertoId,
} = require("../services/contexto");

const router = Router();

// POST /api/membresias — "cobrar membresía": registra el pago de un plan y
// extiende (o inicia) la vigencia del socio. No está en API_CONTRATO.md
// porque el frontend de recepción todavía no lo consume, pero lo pide el
// Paso 3 de la práctica (DBA/backend) y queda listo para Postman/QA.
router.post("/", async (req, res, next) => {
  try {
    const { ci, plan_id, monto_pagado } = req.body || {};

    if (!ci || !plan_id || typeof monto_pagado !== "number" || monto_pagado < 0) {
      return res.status(400).json({
        mensaje: "Se requiere 'ci', 'plan_id' y 'monto_pagado' (>= 0).",
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

    const plan = await pool.query(
      "SELECT id, duracion_dias FROM planes WHERE id = $1 AND activo",
      [plan_id]
    );
    if (plan.rows.length === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado." });
    }
    const { duracion_dias: duracionDias } = plan.rows[0];

    const vigente = await pool.query(
      "SELECT fecha_fin FROM membresias WHERE socio_id = $1 ORDER BY fecha_fin DESC LIMIT 1",
      [socioId]
    );
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const finVigente = vigente.rows[0]?.fecha_fin
      ? new Date(vigente.rows[0].fecha_fin)
      : null;
    // Si la membresía anterior sigue vigente (o vence hoy), la renovación
    // empieza al día siguiente para no cobrar dos veces el mismo día.
    let inicioRenovacion = hoy;
    if (finVigente && finVigente >= hoy) {
      inicioRenovacion = new Date(finVigente);
      inicioRenovacion.setUTCDate(inicioRenovacion.getUTCDate() + 1);
    }

    const usuarioId = await obtenerUsuarioSistemaId(pool);
    const turnoId = await obtenerTurnoAbiertoId(pool, usuarioId);

    const creada = await pool.query(
      `INSERT INTO membresias (socio_id, plan_id, usuario_id, turno_id, fecha_inicio, fecha_fin, monto_pagado)
       VALUES ($1, $2, $3, $4, $5::date, $5::date + $6::int, $7)
       RETURNING id, fecha_inicio, fecha_fin`,
      [socioId, plan_id, usuarioId, turnoId, inicioRenovacion, duracionDias, monto_pagado]
    );

    await pool.query(
      `UPDATE turnos SET total_membresias = total_membresias + $1 WHERE id = $2`,
      [monto_pagado, turnoId]
    );

    const fila = creada.rows[0];
    res.status(201).json({
      id: fila.id,
      ci,
      plan_id,
      fecha_inicio: fila.fecha_inicio,
      fecha_fin: fila.fecha_fin,
      monto_pagado,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
