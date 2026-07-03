-- ============================================================
-- CLEANUP: Eliminar todo antes de re-ejecutar migraciones
-- ============================================================

-- Drop tables (CASCADE elimina policies, triggers, índices automáticamente)
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

-- Drop sequence
DROP SEQUENCE IF EXISTS seq_numero_orden;

-- Drop all functions created by migrations
DROP FUNCTION IF EXISTS apply_table_rls CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS generate_order_number CASCADE;
DROP FUNCTION IF EXISTS calcular_total_orden CASCADE;
DROP FUNCTION IF EXISTS descontar_inventario CASCADE;
DROP FUNCTION IF EXISTS actualizar_totales_orden CASCADE;
DROP FUNCTION IF EXISTS actualizar_inventario_por_compra CASCADE;
DROP FUNCTION IF EXISTS get_current_restaurante_id CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role CASCADE;
