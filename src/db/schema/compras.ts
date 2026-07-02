import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { proveedores } from "./proveedores";

export const compras = pgTable("compras", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  proveedorId: uuid("proveedor_id").references(() => proveedores.id, {
    onDelete: "set null",
  }),
  numeroFactura: varchar("numero_factura", { length: 100 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  impuesto: numeric("impuesto", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
