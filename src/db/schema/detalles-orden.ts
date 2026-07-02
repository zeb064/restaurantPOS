import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { ordenes } from "./ordenes";
import { productos } from "./productos";

export const detallesOrden = pgTable("detalles_orden", {
  id: uuid("id").defaultRandom().primaryKey(),
  ordenId: uuid("orden_id")
    .notNull()
    .references(() => ordenes.id, { onDelete: "cascade" }),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "restrict" }),
  productoNombre: varchar("producto_nombre", { length: 255 }).notNull(),
  cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull().default("1"),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  impuesto: numeric("impuesto", { precision: 5, scale: 2 }).notNull().default("0"),
  impoconsumo: numeric("impoconsumo", { precision: 5, scale: 2 }).notNull().default("0"),
  nota: text("nota"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
