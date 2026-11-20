-- GymControl · Esquema de base de datos (PostgreSQL / Neon)
-- Basado en el modelo DBML de "borrador redes.docx" (UT5/UT6), con 2 columnas
-- añadidas para cumplir el contrato real del frontend (API_CONTRATO.md):
--   - productos.categoria  (el mostrador agrupa productos por categoría)
--   - ventas.metodo_pago   (el corte de caja separa totales por método de pago)

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  rol_id INT NOT NULL REFERENCES roles(id),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE socios (
  id SERIAL PRIMARY KEY,
  carnet VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  foto_url VARCHAR(255),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE planes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  apertura TIMESTAMP NOT NULL DEFAULT now(),
  cierre TIMESTAMP,
  total_membresias NUMERIC(10,2) DEFAULT 0,
  total_productos NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE membresias (
  id SERIAL PRIMARY KEY,
  socio_id INT NOT NULL REFERENCES socios(id),
  plan_id INT NOT NULL REFERENCES planes(id),
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  turno_id INT REFERENCES turnos(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  monto_pagado NUMERIC(10,2) NOT NULL CHECK (monto_pagado >= 0),
  creado_en TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE asistencias (
  id SERIAL PRIMARY KEY,
  socio_id INT NOT NULL REFERENCES socios(id),
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  membresia_id INT REFERENCES membresias(id),
  fecha_hora TIMESTAMP NOT NULL DEFAULT now(),
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('PERMITIDO','DENEGADO')),
  motivo VARCHAR(30)
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(50),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  socio_id INT NOT NULL REFERENCES socios(id),
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  turno_id INT NOT NULL REFERENCES turnos(id),
  fecha_hora TIMESTAMP NOT NULL DEFAULT now(),
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo','qr','tarjeta')),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE detalle_ventas (
  id SERIAL PRIMARY KEY,
  venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INT NOT NULL REFERENCES productos(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_membresias_socio_fin ON membresias (socio_id, fecha_fin DESC);
CREATE INDEX idx_asistencias_socio_fecha ON asistencias (socio_id, fecha_hora DESC);
CREATE INDEX idx_ventas_turno ON ventas (turno_id);
CREATE INDEX idx_ventas_fecha ON ventas (fecha_hora);
