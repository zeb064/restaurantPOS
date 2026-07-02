import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { perfiles } from "./perfiles";

export const cajas = pgTable("cajas", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => perfiles.id, { onDelete: "restrict" }),
  turno: varchar("turno", { length: 20 }).notNull(),
  montoInicial: numeric("monto_inicial", { precision: 12, scale: 2 }).notNull().default("0"),
  montoFinal: numeric("monto_final", { precision: 12, scale: 2 }),
  estado: varchar("estado", { length: 20 }).notNull().default("abierta"),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
