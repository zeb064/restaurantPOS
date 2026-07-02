import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { compras } from "./compras";
import { inventario } from "./inventario";

export const detallesCompra = pgTable("detalles_compra", {
  id: uuid("id").defaultRandom().primaryKey(),
  compraId: uuid("compra_id")
    .notNull()
    .references(() => compras.id, { onDelete: "cascade" }),
  inventarioId: uuid("inventario_id")
    .notNull()
    .references(() => inventario.id, { onDelete: "restrict" }),
  cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
  costoUnitario: numeric("costo_unitario", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
