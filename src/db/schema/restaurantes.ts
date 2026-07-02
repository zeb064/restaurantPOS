import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const restaurantes = pgTable("restaurantes", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 50 }),
  logoUrl: text("logo_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("basico"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
