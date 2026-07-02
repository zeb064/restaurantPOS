import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { cajas } from "./cajas";

export const movimientosCaja = pgTable("movimientos_caja", {
  id: uuid("id").defaultRandom().primaryKey(),
  cajaId: uuid("caja_id")
    .notNull()
    .references(() => cajas.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  concepto: varchar("concepto", { length: 255 }).notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  referenciaOrdenId: uuid("referencia_orden_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
