import { sql } from "drizzle-orm";
import { pgTableCreator } from "drizzle-orm/pg-core";

export const pgTable = pgTableCreator((name) => `pos_${name}`);

export * from "./schema/restaurantes";
export * from "./schema/perfiles";
export * from "./schema/categorias";
export * from "./schema/productos";
export * from "./schema/mesas";
export * from "./schema/ordenes";
export * from "./schema/detalles-orden";
export * from "./schema/pagos";
export * from "./schema/cajas";
export * from "./schema/movimientos-caja";
export * from "./schema/inventario";
export * from "./schema/recetas";
export * from "./schema/ingredientes-receta";
export * from "./schema/compras";
export * from "./schema/detalles-compra";
export * from "./schema/proveedores";
export * from "./schema/bajas-inventario";
export * from "./schema/produccion";
export * from "./schema/tickets-soporte";
export * from "./schema/cuentas-cobrar";
