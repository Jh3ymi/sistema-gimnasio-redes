const { Router } = require("express");
const pool = require("../db/pool");

const router = Router();

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get("/corte", async (req, res, next) => {
  try {
    const { fecha } = req.query;
    if (!fecha || !FECHA_RE.test(fecha)) {
      return res.status(400).json({ mensaje: "Se requiere 'fecha' en formato YYYY-MM-DD." });
    }

    const ventas = await pool.query(
      `SELECT v.id, v.fecha_hora, v.metodo_pago, v.total, s.carnet AS ci
       FROM ventas v
       JOIN socios s ON s.id = v.socio_id
       WHERE v.fecha_hora::date = $1::date
       ORDER BY v.fecha_hora`,
      [fecha]
    );

    const ventaIds = ventas.rows.map((v) => v.id);
    let itemsPorVenta = new Map();

    if (ventaIds.length > 0) {
      const items = await pool.query(
        `SELECT d.venta_id, d.producto_id, p.nombre, d.cantidad, d.precio_unitario,
                (d.cantidad * d.precio_unitario) AS subtotal
         FROM detalle_ventas d
         JOIN productos p ON p.id = d.producto_id
         WHERE d.venta_id = ANY($1::int[])`,
        [ventaIds]
      );
      itemsPorVenta = items.rows.reduce((mapa, fila) => {
        const lista = mapa.get(fila.venta_id) || [];
        lista.push({
          producto_id: fila.producto_id,
          nombre: fila.nombre,
          cantidad: fila.cantidad,
          precio_unitario: Number(fila.precio_unitario),
          subtotal: Number(fila.subtotal),
        });
        mapa.set(fila.venta_id, lista);
        return mapa;
      }, new Map());
    }

    res.json({
      fecha,
      ventas: ventas.rows.map((v) => ({
        id: v.id,
        fecha_hora: v.fecha_hora,
        ci: v.ci,
        metodo_pago: v.metodo_pago,
        total: Number(v.total),
        items: itemsPorVenta.get(v.id) || [],
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
