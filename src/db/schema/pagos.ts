import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { ordenes } from "./ordenes";

export const pagos = pgTable("pagos", {
  id: uuid("id").defaultRandom().primaryKey(),
  ordenId: uuid("orden_id")
    .notNull()
    .references(() => ordenes.id, { onDelete: "cascade" }),
  metodo: varchar("metodo", { length: 30 }).notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  referencia: varchar("referencia", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
