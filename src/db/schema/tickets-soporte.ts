import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { perfiles } from "./perfiles";

export const ticketsSoporte = pgTable("tickets_soporte", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => perfiles.id, { onDelete: "restrict" }),
  asunto: varchar("asunto", { length: 255 }).notNull(),
  descripcion: text("descripcion").notNull(),
  estado: varchar("estado", { length: 20 }).notNull().default("abierto"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
