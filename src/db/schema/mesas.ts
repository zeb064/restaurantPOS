import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";

export const mesas = pgTable("mesas", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  nombre: varchar("nombre", { length: 100 }),
  capacidad: integer("capacidad").notNull().default(4),
  ubicacion: varchar("ubicacion", { length: 100 }),
  qrCodeUrl: text("qr_code_url"),
  estado: varchar("estado", { length: 20 }).notNull().default("libre"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
