import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { recetas } from "./recetas";

export const produccion = pgTable("produccion", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  recetaId: uuid("receta_id")
    .notNull()
    .references(() => recetas.id, { onDelete: "restrict" }),
  cantidadProducida: integer("cantidad_producida").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
