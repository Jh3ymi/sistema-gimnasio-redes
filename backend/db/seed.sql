-- GymControl · Datos semilla
-- Crea el rol y usuario "sistema" que la API usa como responsable de
-- operaciones hechas desde el mostrador sin login (asistencias, ventas),
-- más un plan y productos de ejemplo para poder probar los endpoints.

INSERT INTO roles (nombre) VALUES
  ('admin'),
  ('recepcionista')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuarios (rol_id, nombre, email, password_hash, activo)
SELECT r.id, 'Recepción (sistema)', 'recepcion@gymcontrol.local', 'no-login', TRUE
FROM roles r WHERE r.nombre = 'recepcionista'
ON CONFLICT (email) DO NOTHING;

INSERT INTO planes (nombre, duracion_dias, precio) VALUES
  ('Mensual full', 30, 150.00),
  ('Quincenal', 15, 90.00),
  ('Trimestral', 90, 400.00)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO productos (nombre, categoria, precio, stock) VALUES
  ('Agua 600 ml', 'Bebidas', 5, 48),
  ('Bebida hidratante', 'Bebidas', 8, 30),
  ('Barra energética', 'Snacks', 10, 40),
  ('Proteína (scoop)', 'Suplementos', 15, 60)
ON CONFLICT (nombre) DO NOTHING;

-- Socio de ejemplo para probar GET /api/socios/:ci sin tener que crear datos a mano.
INSERT INTO socios (carnet, nombres, apellidos, telefono, foto_url) VALUES
  ('1234567', 'María Fernanda', 'Quispe', '71234567', NULL)
ON CONFLICT (carnet) DO NOTHING;

INSERT INTO membresias (socio_id, plan_id, usuario_id, fecha_inicio, fecha_fin, monto_pagado)
SELECT s.id, p.id, u.id, CURRENT_DATE, CURRENT_DATE + 30, p.precio
FROM socios s, planes p, usuarios u
WHERE s.carnet = '1234567' AND p.nombre = 'Mensual full' AND u.email = 'recepcion@gymcontrol.local'
ON CONFLICT DO NOTHING;
