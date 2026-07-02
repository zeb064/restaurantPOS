import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { productos } from "./productos";

export const recetas = pgTable("recetas", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  porciones: integer("porciones").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
