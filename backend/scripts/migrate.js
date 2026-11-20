// Ejecuta backend/db/schema.sql y backend/db/seed.sql contra DATABASE_URL.
// Uso: npm run migrate   (equivalente a pegar ambos archivos en el SQL
// Editor "RunSQL" de Neon, pero reproducible y sin copiar/pegar a mano).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const schema = fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(__dirname, "../db/seed.sql"), "utf8");

  const client = await pool.connect();
  try {
    console.log("Aplicando schema.sql...");
    await client.query(schema);
    console.log("Aplicando seed.sql...");
    await client.query(seed);
    console.log("Migración completada.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error al migrar:", err.message);
  process.exit(1);
});
