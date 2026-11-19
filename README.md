# Sistema Web de Recepción - Gimnasio

Plataforma web para la gestión operativa de recepción en gimnasios: control de acceso rápido por Cédula de Identidad (CI), alertas de membresías vigentes o vencidas, y punto de venta de mostrador con descuento automático de inventario.

## Equipo y Roles
* **Nayeli:** Líder de Proyecto / DevOps (Gestión Trello, GitHub, CI/CD Vercel)
* **Elkin:** Desarrollador Backend / DBA (API REST en `/backend` + PostgreSQL en Neon)
* **Humberto:** Desarrollador Frontend (Interfaz web en `/` + GitHub Pages)
* **Mario:** Infraestructura, Redes y Seguridad (DNS, Proxy y SSL/TLS en Cloudflare)
* **Jheymi:** QA / Tester y Documentación (Pruebas integrales, evidencias e informe final)

## Arquitectura y Enlaces de Despliegue
* **Frontend (GitHub Pages):** https://jungshu.github.io/sistema-gimnasio-redes/
* **Backend (Vercel):** Desplegado desde el directorio `/backend`
* **Base de Datos:** PostgreSQL Serverless en Neon
* **Redes, DNS y Seguridad:** Cloudflare (Proxy, SSL/TLS Full Strict, WAF)

## Estructura del Repositorio
* `/` (Raíz): Archivos estáticos del Frontend (`index.html`, hojas de estilo, scripts) y contrato de endpoints (`API_CONTRATO.md`).
* `/backend`: Código fuente del servidor, rutas de la API y conexión a base de datos.
