// El frontend de recepción no tiene login todavía, pero el esquema exige
// usuario_id y turno_id (NOT NULL) en asistencias/membresias/ventas para
// poder auditar quién hizo cada operación. Mientras no haya autenticación,
// toda operación se atribuye al usuario "sistema" sembrado en seed.sql y a
// su turno abierto del momento (se abre uno nuevo si no existe).

const USUARIO_SISTEMA_EMAIL = "recepcion@gymcontrol.local";

let usuarioSistemaIdCache = null;

async function obtenerUsuarioSistemaId(client) {
  if (usuarioSistemaIdCache) return usuarioSistemaIdCache;
  const { rows } = await client.query(
    "SELECT id FROM usuarios WHERE email = $1",
    [USUARIO_SISTEMA_EMAIL]
  );
  if (rows.length === 0) {
    throw new Error(
      "No existe el usuario sistema. Ejecuta backend/db/seed.sql antes de usar la API."
    );
  }
  usuarioSistemaIdCache = rows[0].id;
  return usuarioSistemaIdCache;
}

async function obtenerTurnoAbiertoId(client, usuarioId) {
  const abierto = await client.query(
    "SELECT id FROM turnos WHERE usuario_id = $1 AND cierre IS NULL ORDER BY apertura DESC LIMIT 1",
    [usuarioId]
  );
  if (abierto.rows.length > 0) return abierto.rows[0].id;

  const creado = await client.query(
    "INSERT INTO turnos (usuario_id) VALUES ($1) RETURNING id",
    [usuarioId]
  );
  return creado.rows[0].id;
}

module.exports = { obtenerUsuarioSistemaId, obtenerTurnoAbiertoId };
