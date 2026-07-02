import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";

export const proveedores = pgTable("proveedores", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  contacto: varchar("contacto", { length: 255 }),
  telefono: varchar("telefono", { length: 50 }),
  email: varchar("email", { length: 255 }),
  direccion: text("direccion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
