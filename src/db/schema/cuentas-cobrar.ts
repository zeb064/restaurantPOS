import { pgTable, uuid, varchar, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { ordenes } from "./ordenes";

export const cuentasCobrar = pgTable("cuentas_cobrar", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  ordenId: uuid("orden_id")
    .notNull()
    .references(() => ordenes.id, { onDelete: "cascade" }),
  clienteNombre: varchar("cliente_nombre", { length: 255 }).notNull(),
  clienteTelefono: varchar("cliente_telefono", { length: 50 }),
  montoTotal: numeric("monto_total", { precision: 12, scale: 2 }).notNull(),
  montoPagado: numeric("monto_pagado", { precision: 12, scale: 2 }).notNull().default("0"),
  estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
  vencimiento: date("vencimiento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
