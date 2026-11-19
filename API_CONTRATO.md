# Contrato de la API REST: Frontend de recepción ↔ Backend

The frontend (`index.html`, published on GitHub Pages) uses these endpoints.
All responses are **JSON**, and the server must allow **CORS** for the GitHub Pages domain.

**Base URL:** the one Elkin provides (example: `https://api-gimnasio.ejemplo.com/api`).
It is set in the ⚙ button on the page, or in the `API_POR_DEFECTO` constant inside `index.html`.

---

## 1. Look up a member by CI
`GET /socios/{ci}`

**200 OK**
```json
{
  "ci": "1234567",
  "nombre": "María Fernanda Quispe",
  "foto_url": "https://.../fotos/1234567.jpg",
  "plan": "Mensual full",
  "fecha_vencimiento": "2026-12-10",
  "deuda": 0,
  "telefono": "71234567",
  "ultimos_accesos": [
    { "fecha_hora": "2026-11-18T08:15:00", "resultado": "permitido" }
  ]
}
```
**404**: CI not registered.

> The frontend decides the alert:
> `deuda > 0` → **blocked for debt** · `fecha_vencimiento < hoy` → **expired** (blocked) · ≤ 5 days left → **about to expire** (allowed).
> It also accepts `nombres` + `apellidos` in place of `nombre`, and `foto` in place of `foto_url`.

## 2. Record an entry
`POST /accesos`
```json
{ "ci": "1234567", "resultado": "permitido" }
```
It is also sent with `"resultado": "denegado", "motivo": "deuda" | "vencida" | "sin_membresia"` when an entry is blocked (optional to store).

## 3. Products for counter sales
`GET /productos`
```json
[
  { "id": 1, "nombre": "Agua 600 ml", "precio": 5, "categoria": "Bebidas", "stock": 48 },
  { "id": 4, "nombre": "Proteína (scoop)", "precio": 15, "categoria": "Suplementos", "stock": 60 }
]
```
(`stock: null` = unlimited. This endpoint is also used to test the connection.)

## 4. Record a sale (linked to a CI)
`POST /ventas`
```json
{
  "ci": "1234567",
  "metodo_pago": "efectivo",
  "items": [
    { "producto_id": 1, "nombre": "Agua 600 ml", "cantidad": 2, "precio_unitario": 5, "subtotal": 10 }
  ],
  "total": 10
}
```
**201**: `{ "id": 1001, "fecha_hora": "2026-11-18T10:30:00", ... }`
`metodo_pago`: `efectivo` | `qr` | `tarjeta`. The backend should reduce stock.

## 5. Daily cash-register close
`GET /caja/corte?fecha=YYYY-MM-DD`
```json
{
  "fecha": "2026-11-18",
  "ventas": [
    { "id": 1001, "fecha_hora": "2026-11-18T10:30:00", "ci": "1234567",
      "metodo_pago": "efectivo", "total": 10,
      "items": [ { "producto_id": 1, "nombre": "Agua 600 ml", "cantidad": 2, "precio_unitario": 5, "subtotal": 10 } ] }
  ]
}
```
The frontend calculates totals by product and by payment method, and exports to CSV / prints.

---

## Errors
Any error response should include `{ "mensaje": "..." }`; the frontend shows that text.

## Network requirements (important)
1. **CORS:** respond with `Access-Control-Allow-Origin: https://jungshu.github.io` (or `*` while testing) and allow `Content-Type` in `Access-Control-Allow-Headers`, including the `OPTIONS` preflight.
2. **HTTPS:** GitHub Pages serves over HTTPS, so the browser **blocks** requests to an `http://` API (mixed content). If the backend runs on a local machine or VM, expose it over HTTPS (for example with a reverse proxy using a certificate, or a tunnel like Cloudflare Tunnel or ngrok).
