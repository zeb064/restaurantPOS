-- ============================================================
-- MIGRACIÓN 001: Vistas analíticas y funciones administrativas
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

  -- Descontar ingredientes
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
