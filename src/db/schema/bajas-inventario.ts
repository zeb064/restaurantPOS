import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { inventario } from "./inventario";

export const bajasInventario = pgTable("bajas_inventario", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  inventarioId: uuid("inventario_id")
    .notNull()
    .references(() => inventario.id, { onDelete: "restrict" }),
  cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
  motivo: varchar("motivo", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
