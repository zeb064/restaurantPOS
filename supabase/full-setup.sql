-- ============================================================
-- FULL SETUP: Limpieza + Migraciones + Configuración + Seed
-- Copiar y pegar TODO esto en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- PASO 1: LIMPIEZA (eliminar todo lo anterior)
-- ============================================================

DROP TABLE IF EXISTS tickets_soporte CASCADE;
DROP TABLE IF EXISTS cuentas_cobrar CASCADE;
DROP TABLE IF EXISTS movimientos_caja CASCADE;
DROP TABLE IF EXISTS bajas_inventario CASCADE;
DROP TABLE IF EXISTS produccion CASCADE;
DROP TABLE IF EXISTS detalles_compra CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS ingredientes_receta CASCADE;
DROP TABLE IF EXISTS recetas CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS detalles_orden CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;

DROP SEQUENCE IF EXISTS seq_numero_orden;

DROP FUNCTION IF EXISTS apply_table_rls CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS generate_order_number CASCADE;
DROP FUNCTION IF EXISTS calcular_total_orden CASCADE;
DROP FUNCTION IF EXISTS descontar_inventario CASCADE;
DROP FUNCTION IF EXISTS actualizar_totales_orden CASCADE;
DROP FUNCTION IF EXISTS actualizar_inventario_por_compra CASCADE;
DROP FUNCTION IF EXISTS get_current_restaurante_id CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_totales CASCADE;
DROP FUNCTION IF EXISTS cerrar_caja CASCADE;
DROP FUNCTION IF EXISTS registrar_baja_inventario CASCADE;
DROP FUNCTION IF EXISTS registrar_produccion CASCADE;
DROP FUNCTION IF EXISTS generar_enlace_whatsapp CASCADE;

-- ============================================================
-- PASO 2: MIGRACIÓN INICIAL (0000_initial_schema.sql)
-- ============================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNCIONES ÚTILES
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_orden := LPAD(CAST(nextval('seq_numero_orden') AS TEXT), 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calcular_total_orden(orden_id UUID)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_impuesto NUMERIC(12,2);
  v_impoconsumo NUMERIC(12,2);
  v_propina NUMERIC(12,2);
  v_descuento NUMERIC(12,2);
BEGIN
  SELECT
    COALESCE(SUM(d.cantidad * d.precio_unitario), 0),
    COALESCE(SUM(d.cantidad * d.precio_unitario * d.impuesto / 100), 0),
    COALESCE(SUM(d.cantidad * d.precio_unitario * d.impoconsumo / 100), 0)
  INTO v_subtotal, v_impuesto, v_impoconsumo
  FROM detalles_orden d
  WHERE d.orden_id = orden_id;

  SELECT propina, descuento
  INTO v_propina, v_descuento
  FROM ordenes WHERE id = orden_id;

  RETURN v_subtotal + v_impuesto + v_impoconsumo + v_propina - v_descuento;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION descontar_inventario()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.estado = 'listo' AND OLD.estado = 'en_preparacion' THEN
    FOR r IN
      SELECT ir.inventario_id, ir.cantidad * d.cantidad AS cantidad_total
      FROM detalles_orden d
      JOIN recetas rec ON rec.producto_id = d.producto_id
      JOIN ingredientes_receta ir ON ir.receta_id = rec.id
      WHERE d.orden_id = NEW.id
    LOOP
      UPDATE inventario
      SET cantidad_actual = cantidad_actual - r.cantidad_total
      WHERE id = r.inventario_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. SECUENCIAS
CREATE SEQUENCE IF NOT EXISTS seq_numero_orden START 1;

-- 4. TABLAS

-- 4.1. Restaurantes
CREATE TABLE IF NOT EXISTS restaurantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(50),
  logo_url TEXT,
  plan VARCHAR(20) NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'medio', 'avanzado')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2. Perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  rol VARCHAR(20) NOT NULL DEFAULT 'cajero' CHECK (rol IN ('admin', 'cajero', 'mesero', 'cocina')),
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3. Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  color VARCHAR(20),
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4. Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
  precio_delivery NUMERIC(12,2) CHECK (precio_delivery >= 0),
  costo_estimado NUMERIC(12,2) CHECK (costo_estimado >= 0),
  imagen_url TEXT,
  codigo_barras VARCHAR(100),
  unidad_medida VARCHAR(20) NOT NULL DEFAULT 'unidad',
  impuesto NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  impoconsumo NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (impoconsumo >= 0),
  es_combo BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5. Mesas
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nombre VARCHAR(100),
  capacidad INTEGER NOT NULL DEFAULT 4 CHECK (capacidad > 0),
  ubicacion VARCHAR(100),
  qr_code_url TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'pidiendo', 'cuenta_pedida')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurante_id, numero)
);

-- 4.6. Órdenes
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  numero_orden VARCHAR(10),
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  cliente_nombre VARCHAR(255),
  tipo VARCHAR(20) NOT NULL DEFAULT 'mostrador' CHECK (tipo IN ('mostrador', 'mesa', 'delivery')),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  impuesto NUMERIC(12,2) NOT NULL DEFAULT 0,
  impoconsumo NUMERIC(12,2) NOT NULL DEFAULT 0,
  propina NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.7. Detalles de orden
CREATE TABLE IF NOT EXISTS detalles_orden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  producto_nombre VARCHAR(255) NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  impuesto NUMERIC(5,2) NOT NULL DEFAULT 0,
  impoconsumo NUMERIC(5,2) NOT NULL DEFAULT 0,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.8. Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia', 'billetera_digital', 'credito')),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  referencia VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.9. Cajas (apertura/cierre)
CREATE TABLE IF NOT EXISTS cajas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manana', 'tarde', 'noche')),
  monto_inicial NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_inicial >= 0),
  monto_final NUMERIC(12,2) CHECK (monto_final >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.10. Movimientos de caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'cortesia')),
  concepto VARCHAR(255) NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  referencia_orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.11. Inventario (insumos/materia prima)
CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  unidad_medida VARCHAR(20) NOT NULL DEFAULT 'unidad',
  cantidad_actual NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
  cantidad_minima NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (cantidad_minima >= 0),
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.12. Recetas (escandallos)
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  porciones INTEGER NOT NULL DEFAULT 1 CHECK (porciones > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.13. Ingredientes de receta
CREATE TABLE IF NOT EXISTS ingredientes_receta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES inventario(id) ON DELETE RESTRICT,
  cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.14. Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.15. Compras
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  numero_factura VARCHAR(100),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  impuesto NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.16. Detalles de compra
CREATE TABLE IF NOT EXISTS detalles_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES inventario(id) ON DELETE RESTRICT,
  cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(12,2) NOT NULL CHECK (costo_unitario >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.17. Bajas de inventario (mermas, pérdidas)
CREATE TABLE IF NOT EXISTS bajas_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES inventario(id) ON DELETE RESTRICT,
  cantidad NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
  motivo VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.18. Producción (preparaciones base)
CREATE TABLE IF NOT EXISTS produccion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE RESTRICT,
  cantidad_producida INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_producida > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.19. Tickets de soporte
CREATE TABLE IF NOT EXISTS tickets_soporte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_curso', 'resuelto', 'cerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.20. Cuentas por cobrar (crédito)
CREATE TABLE IF NOT EXISTS cuentas_cobrar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  cliente_nombre VARCHAR(255) NOT NULL,
  cliente_telefono VARCHAR(50),
  monto_total NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
  monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'anulado')),
  vencimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario_id ON perfiles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_restaurante_id ON perfiles(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_productos_restaurante_id ON productos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_mesas_restaurante_id ON mesas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_restaurante_id ON ordenes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_mesa_id ON ordenes(mesa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_tipo ON ordenes(tipo);
CREATE INDEX IF NOT EXISTS idx_ordenes_created_at ON ordenes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detalles_orden_id ON detalles_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_orden_id ON pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_cajas_restaurante_id ON cajas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_cajas_estado ON cajas(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_restaurante_id ON inventario(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo ON inventario(restaurante_id) WHERE cantidad_actual <= cantidad_minima;
CREATE INDEX IF NOT EXISTS idx_recetas_producto_id ON recetas(producto_id);
CREATE INDEX IF NOT EXISTS idx_compras_restaurante_id ON compras(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_restaurante_id ON proveedores(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_restaurante_id ON cuentas_cobrar(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobrar_estado ON cuentas_cobrar(estado);

-- 6. TRIGGERS

-- 6.1. updated_at triggers
CREATE TRIGGER update_restaurantes_updated_at
  BEFORE UPDATE ON restaurantes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_perfiles_updated_at
  BEFORE UPDATE ON perfiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ordenes_updated_at
  BEFORE UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cajas_updated_at
  BEFORE UPDATE ON cajas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventario_updated_at
  BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recetas_updated_at
  BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tickets_soporte_updated_at
  BEFORE UPDATE ON tickets_soporte FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cuentas_cobrar_updated_at
  BEFORE UPDATE ON cuentas_cobrar FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6.2. Auto-generar número de orden
CREATE TRIGGER generar_numero_orden
  BEFORE INSERT ON ordenes FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 6.3. Descontar inventario al marcar orden como "listo"
CREATE TRIGGER descontar_inventario_al_listo
  AFTER UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION descontar_inventario();

-- 6.4. Actualizar total de orden al insertar detalle
CREATE OR REPLACE FUNCTION actualizar_totales_orden()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ordenes
  SET
    subtotal = (SELECT COALESCE(SUM(d.cantidad * d.precio_unitario), 0)
                FROM detalles_orden d WHERE d.orden_id = NEW.orden_id),
    impuesto = (SELECT COALESCE(SUM(d.cantidad * d.precio_unitario * d.impuesto / 100), 0)
                FROM detalles_orden d WHERE d.orden_id = NEW.orden_id),
    impoconsumo = (SELECT COALESCE(SUM(d.cantidad * d.precio_unitario * d.impoconsumo / 100), 0)
                   FROM detalles_orden d WHERE d.orden_id = NEW.orden_id),
    total = calcular_total_orden(NEW.orden_id)
  WHERE id = NEW.orden_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_totales_al_insertar_detalle
  AFTER INSERT OR UPDATE OR DELETE ON detalles_orden
  FOR EACH ROW EXECUTE FUNCTION actualizar_totales_orden();

-- 6.5. Actualizar inventario al completar compra
CREATE OR REPLACE FUNCTION actualizar_inventario_por_compra()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.estado = 'completada' AND (OLD IS NULL OR OLD.estado != 'completada') THEN
    FOR r IN
      SELECT dc.inventario_id, dc.cantidad, dc.costo_unitario
      FROM detalles_compra dc
      WHERE dc.compra_id = NEW.id
    LOOP
      UPDATE inventario
      SET
        cantidad_actual = cantidad_actual + r.cantidad,
        costo_unitario = r.costo_unitario
      WHERE id = r.inventario_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_inventario_compra
  AFTER UPDATE ON compras FOR EACH ROW EXECUTE FUNCTION actualizar_inventario_por_compra();

-- 7. ROW LEVEL SECURITY (RLS)

-- 7.1. Habilitar RLS en todas las tablas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_receta ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE bajas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_soporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_cobrar ENABLE ROW LEVEL SECURITY;

-- 7.2. Función helper para obtener restaurant_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_restaurante_id()
RETURNS UUID AS $$
DECLARE
  v_restaurante_id UUID;
BEGIN
  SELECT restaurante_id INTO v_restaurante_id
  FROM perfiles
  WHERE usuario_id = auth.uid()
  LIMIT 1;
  RETURN v_restaurante_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7.3. Función helper para verificar rol del usuario
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT rol INTO v_role
  FROM perfiles
  WHERE usuario_id = auth.uid()
  LIMIT 1;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7.4. Políticas para restaurantes
CREATE POLICY "Usuarios ven su propio restaurante"
  ON restaurantes FOR SELECT
  USING (id = get_current_restaurante_id());

CREATE POLICY "Admin puede actualizar su restaurante"
  ON restaurantes FOR UPDATE
  USING (id = get_current_restaurante_id() AND get_current_user_role() = 'admin');

-- 7.5. Políticas para perfiles
CREATE POLICY "Usuarios ven perfiles de su restaurante"
  ON perfiles FOR SELECT
  USING (restaurante_id = get_current_restaurante_id());

CREATE POLICY "Admin puede gestionar perfiles"
  ON perfiles FOR INSERT
  WITH CHECK (restaurante_id = get_current_restaurante_id() AND get_current_user_role() = 'admin');

CREATE POLICY "Admin puede actualizar perfiles"
  ON perfiles FOR UPDATE
  USING (restaurante_id = get_current_restaurante_id() AND get_current_user_role() = 'admin');

-- 7.6. Políticas genéricas para tablas con restaurante_id
CREATE OR REPLACE FUNCTION apply_table_rls(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY "Acceso por restaurante" ON %I FOR SELECT USING (restaurante_id = get_current_restaurante_id());',
    table_name
  );
  EXECUTE format(
    'CREATE POLICY "Insertar por restaurante" ON %I FOR INSERT WITH CHECK (restaurante_id = get_current_restaurante_id());',
    table_name
  );
  EXECUTE format(
    'CREATE POLICY "Actualizar por restaurante" ON %I FOR UPDATE USING (restaurante_id = get_current_restaurante_id());',
    table_name
  );
  EXECUTE format(
    'CREATE POLICY "Eliminar por restaurante" ON %I FOR DELETE USING (restaurante_id = get_current_restaurante_id() AND get_current_user_role() = ''admin'');',
    table_name
  );
END;
$$ LANGUAGE plpgsql;

SELECT apply_table_rls('categorias');
SELECT apply_table_rls('productos');
SELECT apply_table_rls('mesas');
SELECT apply_table_rls('ordenes');
SELECT apply_table_rls('cajas');
SELECT apply_table_rls('inventario');
SELECT apply_table_rls('recetas');
SELECT apply_table_rls('proveedores');
SELECT apply_table_rls('compras');
SELECT apply_table_rls('bajas_inventario');
SELECT apply_table_rls('produccion');
SELECT apply_table_rls('tickets_soporte');
SELECT apply_table_rls('cuentas_cobrar');

DROP FUNCTION apply_table_rls;

-- 7.7. Políticas específicas para tablas sin restaurante_id directo
CREATE POLICY "Acceso detalles_orden por orden"
  ON detalles_orden FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordenes
      WHERE ordenes.id = detalles_orden.orden_id
      AND ordenes.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Insertar detalles_orden por orden"
  ON detalles_orden FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes
      WHERE ordenes.id = detalles_orden.orden_id
      AND ordenes.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Acceso pagos por orden"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordenes
      WHERE ordenes.id = pagos.orden_id
      AND ordenes.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Insertar pagos por orden"
  ON pagos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes
      WHERE ordenes.id = pagos.orden_id
      AND ordenes.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Acceso movimientos_caja por caja"
  ON movimientos_caja FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cajas
      WHERE cajas.id = movimientos_caja.caja_id
      AND cajas.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Insertar movimientos_caja por caja"
  ON movimientos_caja FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cajas
      WHERE cajas.id = movimientos_caja.caja_id
      AND cajas.restaurante_id = get_current_restaurante_id()
    )
  );

-- 7.8. Políticas específicas para ingredientes_receta (sin restaurante_id directo)
CREATE POLICY "Acceso ingredientes_receta por receta"
  ON ingredientes_receta FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recetas
      WHERE recetas.id = ingredientes_receta.receta_id
      AND recetas.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Insertar ingredientes_receta por receta"
  ON ingredientes_receta FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recetas
      WHERE recetas.id = ingredientes_receta.receta_id
      AND recetas.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Actualizar ingredientes_receta por receta"
  ON ingredientes_receta FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recetas
      WHERE recetas.id = ingredientes_receta.receta_id
      AND recetas.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Eliminar ingredientes_receta por receta"
  ON ingredientes_receta FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recetas
      WHERE recetas.id = ingredientes_receta.receta_id
      AND recetas.restaurante_id = get_current_restaurante_id()
    )
    AND get_current_user_role() = 'admin'
  );

-- 7.9. Políticas específicas para detalles_compra (sin restaurante_id directo)
CREATE POLICY "Acceso detalles_compra por compra"
  ON detalles_compra FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compras
      WHERE compras.id = detalles_compra.compra_id
      AND compras.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Insertar detalles_compra por compra"
  ON detalles_compra FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compras
      WHERE compras.id = detalles_compra.compra_id
      AND compras.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Actualizar detalles_compra por compra"
  ON detalles_compra FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM compras
      WHERE compras.id = detalles_compra.compra_id
      AND compras.restaurante_id = get_current_restaurante_id()
    )
  );

CREATE POLICY "Eliminar detalles_compra por compra"
  ON detalles_compra FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM compras
      WHERE compras.id = detalles_compra.compra_id
      AND compras.restaurante_id = get_current_restaurante_id()
    )
    AND get_current_user_role() = 'admin'
  );

-- 8. CONFIGURACIÓN SUPABASE REALTIME
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['ordenes','detalles_orden','pagos','cajas','mesas','inventario','productos'])
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- PASO 3: VISTAS Y FUNCIONES (0001_views_and_functions.sql)
-- ============================================================

-- 1. VISTA: Ventas del día (resumen)
CREATE OR REPLACE VIEW vista_ventas_diarias AS
SELECT
  o.restaurante_id,
  DATE(o.created_at) AS fecha,
  COUNT(DISTINCT o.id) AS total_ordenes,
  COUNT(DISTINCT CASE WHEN o.tipo = 'mostrador' THEN o.id END) AS ordenes_mostrador,
  COUNT(DISTINCT CASE WHEN o.tipo = 'mesa' THEN o.id END) AS ordenes_mesa,
  COUNT(DISTINCT CASE WHEN o.tipo = 'delivery' THEN o.id END) AS ordenes_delivery,
  COALESCE(SUM(o.total), 0) AS ingresos_totales,
  COALESCE(SUM(o.subtotal), 0) AS subtotal_total,
  COALESCE(SUM(o.impuesto), 0) AS impuesto_total,
  COALESCE(SUM(o.propina), 0) AS propina_total,
  COALESCE(AVG(o.total), 0) AS ticket_promedio
FROM ordenes o
WHERE o.estado NOT IN ('cancelado')
GROUP BY o.restaurante_id, DATE(o.created_at);

-- 2. VISTA: Productos más vendidos
CREATE OR REPLACE VIEW vista_productos_mas_vendidos AS
SELECT
  p.restaurante_id,
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  c.nombre AS categoria_nombre,
  COUNT(DISTINCT do2.orden_id) AS veces_vendido,
  SUM(do2.cantidad) AS cantidad_total,
  SUM(do2.cantidad * do2.precio_unitario) AS ingresos_generados
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN detalles_orden do2 ON do2.producto_id = p.id
LEFT JOIN ordenes o ON o.id = do2.orden_id AND o.estado NOT IN ('cancelado')
GROUP BY p.restaurante_id, p.id, p.nombre, c.nombre
ORDER BY SUM(do2.cantidad) DESC NULLS LAST;

-- 3. VISTA: Rentabilidad por producto
CREATE OR REPLACE VIEW vista_rentabilidad_productos AS
SELECT
  p.restaurante_id,
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.precio_venta,
  COALESCE(p.costo_estimado, 0) AS costo_estimado,
  CASE
    WHEN COALESCE(p.costo_estimado, 0) > 0
    THEN ROUND(((p.precio_venta - p.costo_estimado) / p.precio_venta * 100)::numeric, 2)
    ELSE 0
  END AS margen_porcentaje,
  p.precio_venta - COALESCE(p.costo_estimado, 0) AS margen_bruto
FROM productos p
WHERE p.activo = TRUE;

-- 4. VISTA: Stock bajo (puntos de reorden)
CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT
  i.restaurante_id,
  i.id AS inventario_id,
  i.nombre,
  i.unidad_medida,
  i.cantidad_actual,
  i.cantidad_minima,
  i.cantidad_minima - i.cantidad_actual AS cantidad_faltante,
  i.costo_unitario,
  ROUND((i.cantidad_actual * i.costo_unitario)::numeric, 2) AS valor_inventario
FROM inventario i
WHERE i.cantidad_actual <= i.cantidad_minima
ORDER BY i.cantidad_actual ASC;

-- 5. VISTA: Resumen de caja actual
CREATE OR REPLACE VIEW vista_caja_actual AS
SELECT
  c.id AS caja_id,
  c.restaurante_id,
  c.turno,
  p.nombre AS usuario_nombre,
  c.monto_inicial,
  c.estado,
  COALESCE((
    SELECT SUM(monto)
    FROM movimientos_caja mc
    WHERE mc.caja_id = c.id AND mc.tipo = 'ingreso'
  ), 0) AS total_ingresos,
  COALESCE((
    SELECT SUM(monto)
    FROM movimientos_caja mc
    WHERE mc.caja_id = c.id AND mc.tipo = 'egreso'
  ), 0) AS total_egresos,
  COALESCE((
    SELECT SUM(total)
    FROM ordenes o
    WHERE o.restaurante_id = c.restaurante_id
      AND o.created_at >= c.created_at
      AND o.estado = 'entregado'
  ), 0) AS ventas_periodo,
  c.monto_inicial +
    COALESCE((
      SELECT SUM(monto)
      FROM movimientos_caja mc
      WHERE mc.caja_id = c.id AND mc.tipo = 'ingreso'
    ), 0) -
    COALESCE((
      SELECT SUM(monto)
      FROM movimientos_caja mc
      WHERE mc.caja_id = c.id AND mc.tipo = 'egreso'
    ), 0) AS saldo_esperado
FROM cajas c
JOIN perfiles p ON p.id = c.usuario_id
WHERE c.estado = 'abierta';

-- 6. VISTA: Cuentas por cobrar pendientes
CREATE OR REPLACE VIEW vista_cuentas_pendientes AS
SELECT
  cc.restaurante_id,
  cc.id AS cuenta_id,
  cc.cliente_nombre,
  cc.cliente_telefono,
  cc.monto_total,
  cc.monto_pagado,
  cc.monto_total - cc.monto_pagado AS saldo_pendiente,
  cc.vencimiento,
  CASE
    WHEN cc.vencimiento < CURRENT_DATE THEN 'vencida'
    WHEN cc.vencimiento = CURRENT_DATE THEN 'vencen_hoy'
    ELSE 'al_dia'
  END AS estado_vencimiento,
  cc.estado
FROM cuentas_cobrar cc
WHERE cc.estado IN ('pendiente', 'parcial')
ORDER BY cc.vencimiento ASC NULLS LAST;

-- 7. FUNCIÓN: Obtener totales del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_totales(p_restaurante_id UUID)
RETURNS TABLE(
  ventas_hoy NUMERIC,
  ordenes_activas BIGINT,
  mesas_ocupadas BIGINT,
  ticket_promedio NUMERIC,
  producto_top TEXT,
  ingresos_mes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(o.total), 0) AS ventas_hoy,
    COUNT(DISTINCT CASE WHEN o.estado IN ('pendiente', 'en_preparacion') THEN o.id END) AS ordenes_activas,
    COUNT(DISTINCT CASE WHEN m.estado IN ('ocupada', 'pidiendo', 'cuenta_pedida') THEN m.id END) AS mesas_ocupadas,
    COALESCE(AVG(o.total) FILTER (WHERE o.estado = 'entregado'), 0) AS ticket_promedio,
    COALESCE(
      (SELECT do2.producto_nombre
       FROM detalles_orden do2
       JOIN ordenes o2 ON o2.id = do2.orden_id
       WHERE o2.restaurante_id = p_restaurante_id
         AND o2.estado NOT IN ('cancelado')
       GROUP BY do2.producto_nombre
       ORDER BY SUM(do2.cantidad) DESC
       LIMIT 1),
      'N/A'
    ) AS producto_top,
    COALESCE(SUM(o.total) FILTER (
      WHERE o.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND o.estado NOT IN ('cancelado')
    ), 0) AS ingresos_mes
  FROM ordenes o
  LEFT JOIN mesas m ON m.restaurante_id = p_restaurante_id
  WHERE o.restaurante_id = p_restaurante_id
    AND DATE(o.created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. FUNCIÓN: Cerrar caja
CREATE OR REPLACE FUNCTION cerrar_caja(p_caja_id UUID, p_observaciones TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_caja cajas%ROWTYPE;
  v_total_ventas NUMERIC(12,2);
  v_total_ingresos NUMERIC(12,2);
  v_total_egresos NUMERIC(12,2);
  v_saldo_final NUMERIC(12,2);
BEGIN
  SELECT * INTO v_caja FROM cajas WHERE id = p_caja_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Caja no encontrada');
  END IF;

  IF v_caja.estado = 'cerrada' THEN
    RETURN json_build_object('success', FALSE, 'error', 'La caja ya está cerrada');
  END IF;

  SELECT COALESCE(SUM(o.total), 0)
  INTO v_total_ventas
  FROM ordenes o
  WHERE o.restaurante_id = v_caja.restaurante_id
    AND o.created_at >= v_caja.created_at
    AND o.estado = 'entregado';

  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_ingresos
  FROM movimientos_caja
  WHERE caja_id = p_caja_id AND tipo = 'ingreso';

  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_egresos
  FROM movimientos_caja
  WHERE caja_id = p_caja_id AND tipo = 'egreso';

  v_saldo_final := v_caja.monto_inicial + v_total_ingresos - v_total_egresos;

  UPDATE cajas
  SET
    estado = 'cerrada',
    monto_final = v_saldo_final,
    observaciones = p_observaciones,
    updated_at = now()
  WHERE id = p_caja_id;

  RETURN json_build_object(
    'success', TRUE,
    'monto_final', v_saldo_final,
    'total_ventas', v_total_ventas,
    'total_ingresos', v_total_ingresos,
    'total_egresos', v_total_egresos
  );
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCIÓN: Registrar baja de inventario
CREATE OR REPLACE FUNCTION registrar_baja_inventario(
  p_restaurante_id UUID,
  p_inventario_id UUID,
  p_cantidad NUMERIC,
  p_motivo VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_inventario inventario%ROWTYPE;
BEGIN
  SELECT * INTO v_inventario FROM inventario WHERE id = p_inventario_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Producto de inventario no encontrado');
  END IF;

  INSERT INTO bajas_inventario (restaurante_id, inventario_id, cantidad, motivo)
  VALUES (p_restaurante_id, p_inventario_id, p_cantidad, p_motivo);

  UPDATE inventario
  SET cantidad_actual = cantidad_actual - p_cantidad
  WHERE id = p_inventario_id;

  RETURN json_build_object('success', TRUE, 'nuevo_stock', v_inventario.cantidad_actual - p_cantidad);
END;
$$ LANGUAGE plpgsql;

-- 10. FUNCIÓN: Registrar producción
CREATE OR REPLACE FUNCTION registrar_produccion(
  p_restaurante_id UUID,
  p_receta_id UUID,
  p_cantidad INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_receta recetas%ROWTYPE;
  v_ingrediente RECORD;
BEGIN
  SELECT * INTO v_receta FROM recetas WHERE id = p_receta_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Receta no encontrada');
  END IF;

  FOR v_ingrediente IN
    SELECT ir.inventario_id, ir.cantidad * p_cantidad AS total_necesario
    FROM ingredientes_receta ir
    WHERE ir.receta_id = p_receta_id
  LOOP
    UPDATE inventario
    SET cantidad_actual = cantidad_actual - v_ingrediente.total_necesario
    WHERE id = v_ingrediente.inventario_id;
  END LOOP;

  INSERT INTO produccion (restaurante_id, receta_id, cantidad_producida)
  VALUES (p_restaurante_id, p_receta_id, p_cantidad);

  RETURN json_build_object('success', TRUE, 'cantidad_producida', p_cantidad);
END;
$$ LANGUAGE plpgsql;

-- 11. FUNCIÓN: Enviar factura por WhatsApp
CREATE OR REPLACE FUNCTION generar_enlace_whatsapp(
  p_orden_id UUID,
  p_telefono VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_orden ordenes%ROWTYPE;
  v_restaurante restaurantes%ROWTYPE;
  v_cliente_telefono VARCHAR;
  v_mensaje TEXT;
  v_detalle RECORD;
BEGIN
  SELECT * INTO v_orden FROM ordenes WHERE id = p_orden_id;
  SELECT * INTO v_restaurante FROM restaurantes WHERE id = v_orden.restaurante_id;

  v_cliente_telefono := COALESCE(p_telefono, v_orden.cliente_nombre);
  v_cliente_telefono := REGEXP_REPLACE(v_cliente_telefono, '[^0-9]', '', 'g');

  v_mensaje := '*FACTURA DE VENTA*%0A';
  v_mensaje := v_mensaje || v_restaurante.nombre || '%0A';
  v_mensaje := v_mensaje || 'Orden: ' || COALESCE(v_orden.numero_orden, 'N/A') || '%0A';
  v_mensaje := v_mensaje || 'Fecha: ' || TO_CHAR(v_orden.created_at, 'DD/MM/YYYY HH24:MI') || '%0A%0A';
  v_mensaje := v_mensaje || '*DETALLE:*%0A';

  FOR v_detalle IN
    SELECT * FROM detalles_orden WHERE orden_id = p_orden_id
  LOOP
    v_mensaje := v_mensaje || v_detalle.cantidad || 'x ' || v_detalle.producto_nombre || ' - $' || ROUND(v_detalle.cantidad * v_detalle.precio_unitario)::TEXT || '%0A';
  END LOOP;

  v_mensaje := v_mensaje || '%0A*Subtotal:* $' || ROUND(v_orden.subtotal)::TEXT;
  v_mensaje := v_mensaje || '%0A*Impuesto:* $' || ROUND(v_orden.impuesto)::TEXT;
  v_mensaje := v_mensaje || '%0A*Total:* $' || ROUND(v_orden.total)::TEXT;
  v_mensaje := v_mensaje || '%0A%0A¡Gracias por tu compra!';

  RETURN 'https://wa.me/' || COALESCE(v_cliente_telefono, '57') || '?text=' || v_mensaje;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- PASO 4: SETUP (setup.sql)
-- ============================================================

-- CONFIGURACIÓN DE AUTENTICACIÓN
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (usuario_id, restaurante_id, nombre, rol)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- CONFIGURACIÓN DE ALMACENAMIENTO (STORAGE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurantes', 'restaurantes', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Imágenes públicas de productos"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('productos', 'restaurantes'));

CREATE POLICY "Admin puede subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('productos', 'restaurantes')
    AND auth.role() = 'authenticated'
    AND (
      SELECT rol FROM perfiles WHERE usuario_id = auth.uid()
    ) = 'admin'
  );

-- ============================================================
-- PASO 5: SEED DATA (seed.sql) - Datos demo
-- ============================================================

-- 1. RESTAURANTE DEMO
INSERT INTO restaurantes (id, nombre, direccion, telefono, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Restaurante Demo',
  'Calle Principal #123, Ciudad',
  '+57 300 123 4567',
  'avanzado'
) ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORÍAS
INSERT INTO categorias (id, restaurante_id, nombre, descripcion, color, orden) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Entradas', 'Entradas y aperitivos', 'blue', 1),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Platos Fuertes', 'Platos principales', 'green', 2),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas frías y calientes', 'orange', 3),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Postres', 'Postres y dulces', 'pink', 4),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Complementos', 'Acompañamientos y extras', 'gray', 5)
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTOS
INSERT INTO productos (id, restaurante_id, categoria_id, nombre, descripcion, precio_venta, unidad_medida, impuesto, activo) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Nachos con Queso', 'Totopos con queso cheddar y jalapeños', 15000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Alitas BBQ (6und)', 'Alitas de pollo bañadas en salsa BBQ', 22000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Hamburguesa Clásica', 'Carne 200g, queso, lechuga, tomate, cebolla', 22000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Hamburguesa BBQ', 'Carne 200g, queso, cebolla caramelizada, BBQ', 25000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Pizza Personal (Pepperoni)', 'Pizza personal de pepperoni con mozzarella', 18000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Pizza Personal (Hawaiana)', 'Pizza personal con jamón y piña', 18000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Coca-Cola 500ml', 'Gaseosa Coca-Cola personal 500ml', 5000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Limonada Natural', 'Limonada natural con hierbabuena', 7000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Cerveza Artesanal', 'Cerveza artesanal 330ml', 12000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Brownie con Helado', 'Brownie de chocolate con helado de vainilla', 12000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Flan Casero', 'Flan de caramelo con crema batida', 9000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'Papas Fritas', 'Porción de papas fritas', 8000, 'unidad', 19, TRUE),
  ('00000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'Aros de Cebolla', 'Porción de aros de cebolla empanizados', 9000, 'unidad', 19, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. MESAS
INSERT INTO mesas (id, restaurante_id, numero, nombre, capacidad, ubicacion) VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 1, 'Mesa 1', 2, 'Interior - Ventana'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 2, 'Mesa 2', 4, 'Interior - Centro'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 3, 'Mesa 3', 4, 'Interior - Centro'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 4, 'Mesa 4', 6, 'Interior - Salón'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 5, 'Mesa 5', 2, 'Terraza'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 6, 'Mesa 6', 4, 'Terraza'),
  ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 7, 'Mesa 7', 4, 'Terraza'),
  ('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 8, 'Mesa 8', 8, 'Terraza - VIP'),
  ('00000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 9, 'Mesa 9', 6, 'Interior - Privado'),
  ('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', 10, 'Barra', 1, 'Barra')
ON CONFLICT (restaurante_id, numero) DO NOTHING;

-- 5. INVENTARIO (insumos)
INSERT INTO inventario (id, restaurante_id, nombre, unidad_medida, cantidad_actual, cantidad_minima, costo_unitario) VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Pan de hamburguesa', 'unidad', 50, 10, 1500),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Carne molida 200g', 'unidad', 40, 10, 4500),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Queso cheddar (lámina)', 'unidad', 60, 15, 800),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', 'Lechuga (kg)', 'kilogramo', 5, 1, 3000),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', 'Tomate (kg)', 'kilogramo', 8, 2, 2500),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', 'Cebolla (kg)', 'kilogramo', 10, 2, 2000),
  ('00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', 'Papas (kg)', 'kilogramo', 20, 5, 3000),
  ('00000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', 'Coca-Cola 500ml', 'unidad', 48, 12, 2500),
  ('00000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', 'Masa de pizza personal', 'unidad', 30, 10, 2000),
  ('00000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', 'Pepperoni (kg)', 'kilogramo', 3, 1, 15000),
  ('00000000-0000-0000-0000-00000000004a', '00000000-0000-0000-0000-000000000001', 'Queso mozzarella (kg)', 'kilogramo', 5, 1, 12000)
ON CONFLICT (id) DO NOTHING;

-- 6. RECETAS (escandallos)
INSERT INTO recetas (id, restaurante_id, producto_id, nombre, porciones) VALUES
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', 'Receta Hamburguesa Clásica', 1),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', 'Receta Pizza Pepperoni', 1)
ON CONFLICT (id) DO NOTHING;

-- 7. INGREDIENTES DE RECETA
INSERT INTO ingredientes_receta (id, receta_id, inventario_id, cantidad) VALUES
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000040', 1),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000041', 1),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000042', 1),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000043', 0.050),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000044', 0.100),
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000045', 0.030),
  ('00000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000048', 1),
  ('00000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-00000000004a', 0.150),
  ('00000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000049', 0.100)
ON CONFLICT (id) DO NOTHING;

-- 8. PROVEEDORES
INSERT INTO proveedores (id, restaurante_id, nombre, contacto, telefono, email) VALUES
  ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', 'Distribuidora de Carnes S.A.S.', 'Carlos Méndez', '+57 311 222 3344', 'carlos@distcarnes.com'),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', 'Lácteos del Valle', 'María Gómez', '+57 315 444 5566', 'maria@lacteosvalle.com'),
  ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001', 'Bebidas Latinas', 'Pedro Ramírez', '+57 300 777 8899', 'pedro@bebidaslatinas.com')
ON CONFLICT (id) DO NOTHING;
