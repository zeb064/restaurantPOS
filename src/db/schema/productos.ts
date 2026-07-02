import { pgTable, uuid, varchar, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { restaurantes } from "./restaurantes";
import { categorias } from "./categorias";

export const productos = pgTable("productos", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .notNull()
    .references(() => restaurantes.id, { onDelete: "cascade" }),
  categoriaId: uuid("categoria_id")
    .notNull()
    .references(() => categorias.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).notNull().default("0"),
  precioDelivery: numeric("precio_delivery", { precision: 12, scale: 2 }),
  costoEstimado: numeric("costo_estimado", { precision: 12, scale: 2 }),
  imagenUrl: text("imagen_url"),
  codigoBarras: varchar("codigo_barras", { length: 100 }),
  unidadMedida: varchar("unidad_medida", { length: 20 }).notNull().default("unidad"),
  impuesto: numeric("impuesto", { precision: 5, scale: 2 }).notNull().default("0"),
  impoconsumo: numeric("impoconsumo", { precision: 5, scale: 2 }).notNull().default("0"),
  esCombo: boolean("es_combo").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
