const { Router } = require("express");
const pool = require("../db/pool");
const {
  obtenerUsuarioSistemaId,
  obtenerTurnoAbiertoId,
} = require("../services/contexto");

const router = Router();

const METODOS_VALIDOS = new Set(["efectivo", "qr", "tarjeta"]);

function validarVenta(body) {
  const { ci, metodo_pago, items, total } = body || {};
  if (!ci) return "Falta 'ci'.";
  if (!METODOS_VALIDOS.has(metodo_pago)) {
    return "'metodo_pago' debe ser 'efectivo', 'qr' o 'tarjeta'.";
  }
  if (!Array.isArray(items) || items.length === 0) {
    return "'items' debe ser un arreglo con al menos un producto.";
  }
  for (const item of items) {
    if (!item.producto_id || !item.cantidad || item.cantidad <= 0) {
      return "Cada item requiere 'producto_id' y 'cantidad' > 0.";
    }
  }
  if (typeof total !== "number" || total < 0) {
    return "'total' debe ser un número >= 0.";
  }
  return null;
}

router.post("/", async (req, res, next) => {
  const errorValidacion = validarVenta(req.body);
  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  const { ci, metodo_pago, items, total } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const socio = await client.query(
      "SELECT id FROM socios WHERE carnet = $1 AND activo",
      [ci]
    );
    if (socio.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "CI no registrado." });
    }
    const socioId = socio.rows[0].id;

    const usuarioId = await obtenerUsuarioSistemaId(client);
    const turnoId = await obtenerTurnoAbiertoId(client, usuarioId);

    const venta = await client.query(
      `INSERT INTO ventas (socio_id, usuario_id, turno_id, metodo_pago, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fecha_hora`,
      [socioId, usuarioId, turnoId, metodo_pago, total]
    );
    const ventaId = venta.rows[0].id;

    for (const item of items) {
      const precioUnitario = item.precio_unitario ?? 0;

      const stockActualizado = await client.query(
        `UPDATE productos SET stock = stock - $1
         WHERE id = $2 AND stock >= $1
         RETURNING id`,
        [item.cantidad, item.producto_id]
      );
      if (stockActualizado.rows.length === 0) {
        throw Object.assign(
          new Error(`Stock insuficiente para el producto ${item.producto_id}.`),
          { status: 409 }
        );
      }

      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [ventaId, item.producto_id, item.cantidad, precioUnitario]
      );
    }

    await client.query(
      `UPDATE turnos SET total_productos = total_productos + $1 WHERE id = $2`,
      [total, turnoId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      id: ventaId,
      fecha_hora: venta.rows[0].fecha_hora,
      ci,
      metodo_pago,
      items,
      total,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) return res.status(err.status).json({ mensaje: err.message });
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
