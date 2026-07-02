import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";

export const inventario = pgTable("inventario", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  productoId: uuid("producto_id"),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  unidadMedida: varchar("unidad_medida", { length: 20 }).notNull().default("unidad"),
  cantidadActual: numeric("cantidad_actual", { precision: 12, scale: 3 }).notNull().default("0"),
  cantidadMinima: numeric("cantidad_minima", { precision: 12, scale: 3 }).notNull().default("0"),
  costUnitario: numeric("costo_unitario", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
