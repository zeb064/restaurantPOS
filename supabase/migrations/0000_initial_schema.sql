-- ============================================================
-- MIGRACIÓN INICIAL: Sistema ERP/POS para Restaurantes
-- Versión: 1.0.0
-- ============================================================

-- 1. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNCIONES ÚTILES
-- ============================================================
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
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS seq_numero_orden START 1;

-- 4. TABLAS
-- ============================================================

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
-- ============================================================
CREATE INDEX idx_perfiles_usuario_id ON perfiles(usuario_id);
CREATE INDEX idx_perfiles_restaurante_id ON perfiles(restaurante_id);
CREATE INDEX idx_productos_restaurante_id ON productos(restaurante_id);
CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_mesas_restaurante_id ON mesas(restaurante_id);
CREATE INDEX idx_mesas_estado ON mesas(estado);
CREATE INDEX idx_ordenes_restaurante_id ON ordenes(restaurante_id);
CREATE INDEX idx_ordenes_mesa_id ON ordenes(mesa_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_tipo ON ordenes(tipo);
CREATE INDEX idx_ordenes_created_at ON ordenes(created_at DESC);
CREATE INDEX idx_detalles_orden_id ON detalles_orden(orden_id);
CREATE INDEX idx_pagos_orden_id ON pagos(orden_id);
CREATE INDEX idx_cajas_restaurante_id ON cajas(restaurante_id);
CREATE INDEX idx_cajas_estado ON cajas(estado);
CREATE INDEX idx_inventario_restaurante_id ON inventario(restaurante_id);
CREATE INDEX idx_inventario_stock_bajo ON inventario(restaurante_id) WHERE cantidad_actual <= cantidad_minima;
CREATE INDEX idx_recetas_producto_id ON recetas(producto_id);
CREATE INDEX idx_compras_restaurante_id ON compras(restaurante_id);
CREATE INDEX idx_proveedores_restaurante_id ON proveedores(restaurante_id);
CREATE INDEX idx_cuentas_cobrar_restaurante_id ON cuentas_cobrar(restaurante_id);
CREATE INDEX idx_cuentas_cobrar_estado ON cuentas_cobrar(estado);

-- 6. TRIGGERS
-- ============================================================

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
-- ============================================================

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
-- Usamos una función para generar políticas estándar
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
SELECT apply_table_rls('ingredientes_receta');
SELECT apply_table_rls('proveedores');
SELECT apply_table_rls('compras');
SELECT apply_table_rls('detalles_compra');
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

-- 8. CONFIGURACIÓN SUPABASE REALTIME
-- ============================================================
-- Habilitar replicación realtime para tablas clave
ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE detalles_orden;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
ALTER PUBLICATION supabase_realtime ADD TABLE cajas;
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE inventario;
ALTER PUBLICATION supabase_realtime ADD TABLE productos;
