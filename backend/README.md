# GymControl API

API REST en Node.js (Express) + PostgreSQL (Neon) para el módulo de recepción de GymControl:
búsqueda de socios por CI, registro de asistencia, cobro de membresías, ventas de mostrador
con descuento de inventario y corte de caja diario.

## Requisitos

- Node.js 18+
- Una base de datos PostgreSQL (Neon)

## Configuración local

```bash
cd backend
npm install
cp .env.example .env   # completa DATABASE_URL con la cadena de conexión de Neon
npm run migrate         # crea las tablas (schema.sql) y carga datos de ejemplo (seed.sql)
npm run dev              # http://localhost:3000
```

`npm run migrate` hace exactamente lo que pide la guía ("ejecutar el DDL con RunSQL en Neon"),
pero de forma reproducible: ejecuta `db/schema.sql` y `db/seed.sql` contra `DATABASE_URL`. También
puedes pegar esos dos archivos manualmente en el SQL Editor de Neon si prefieres hacerlo así.

## Modelo de datos

10 tablas: `roles`, `usuarios`, `socios`, `planes`, `turnos`, `membresias`, `asistencias`,
`productos`, `ventas`, `detalle_ventas`. El modelado completo (DBML + diagrama ER) está en
[`/docs/modelado-bd-gymcontrol.pdf`](../docs/modelado-bd-gymcontrol.pdf), fuera de este
directorio de código.

Como el esquema interno usa `carnet` (y no `ci`), la API traduce ese campo en las respuestas
JSON para cumplir el contrato ya acordado con el frontend (`/API_CONTRATO.md` en la raíz del
repo). Igual se agregaron `productos.categoria` y `ventas.metodo_pago`, que no estaban en el
DDL original del docx pero sí los necesita ese contrato.

No hay login todavía: toda operación (asistencia, venta, membresía) se atribuye a un usuario
"sistema" sembrado en `seed.sql` y a su turno abierto (se abre uno automáticamente si no existe).
Ver `src/services/contexto.js`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/socios/:ci` | Datos del socio, plan, vencimiento, deuda y últimos accesos |
| POST | `/api/accesos` | Registra una asistencia (`permitido` / `denegado`) |
| GET | `/api/productos` | Catálogo de productos activos |
| POST | `/api/ventas` | Registra una venta de mostrador y descuenta stock |
| GET | `/api/planes` | Catálogo de planes activos (para el selector de cobro) |
| POST | `/api/membresias` | Cobra/renueva la membresía de un socio |
| GET | `/api/caja/corte?fecha=YYYY-MM-DD` | Ventas del día, para el corte de caja |

Ejemplos de payloads en [`/API_CONTRATO.md`](../API_CONTRATO.md).

## Despliegue en Vercel

1. Importa el repositorio en Vercel y configura el **Root Directory** en `backend`.
2. Define la variable de entorno `DATABASE_URL` (y opcionalmente `CORS_ORIGIN`) en el proyecto de Vercel.
3. Vercel detecta `api/index.js` como función serverless; `vercel.json` reescribe todas las rutas hacia ella para que Express maneje `/api/*`.
4. Verifica `GET https://<tu-api>.vercel.app/api/productos`.
