import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { mesas } from "./mesas";
import { perfiles } from "./perfiles";

export const ordenes = pgTable("ordenes", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  mesaId: uuid("mesa_id").references(() => mesas.id, { onDelete: "set null" }),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => perfiles.id, { onDelete: "restrict" }),
  numeroOrden: varchar("numero_orden", { length: 10 }),
  clienteNombre: varchar("cliente_nombre", { length: 255 }),
  tipo: varchar("tipo", { length: 20 }).notNull().default("mostrador"),
  estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  impuesto: numeric("impuesto", { precision: 12, scale: 2 }).notNull().default("0"),
  impoconsumo: numeric("impoconsumo", { precision: 12, scale: 2 }).notNull().default("0"),
  propina: numeric("propina", { precision: 12, scale: 2 }).notNull().default("0"),
  descuento: numeric("descuento", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  nota: text("nota"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
