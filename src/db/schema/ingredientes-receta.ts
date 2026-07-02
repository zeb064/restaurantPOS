import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { recetas } from "./recetas";
import { inventario } from "./inventario";

export const ingredientesReceta = pgTable("ingredientes_receta", {
  id: uuid("id").defaultRandom().primaryKey(),
  recetaId: uuid("receta_id")
    .notNull()
    .references(() => recetas.id, { onDelete: "cascade" }),
  inventarioId: uuid("inventario_id")
    .notNull()
    .references(() => inventario.id, { onDelete: "restrict" }),
  cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
