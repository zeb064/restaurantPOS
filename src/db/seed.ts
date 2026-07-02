import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  await db.execute(sql`
    INSERT INTO restaurantes (id, nombre, plan) VALUES
      ('00000000-0000-0000-0000-000000000001', 'Restaurante Demo', 'avanzado')
    ON CONFLICT (id) DO NOTHING;
  `);

  await db.execute(sql`
    INSERT INTO categorias (id, restaurante_id, nombre, orden) VALUES
      ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Entradas', 1),
      ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Platos Fuertes', 2),
      ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Bebidas', 3),
      ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Postres', 4)
    ON CONFLICT (id) DO NOTHING;
  `);

  await db.execute(sql`
    INSERT INTO productos (id, restaurante_id, categoria_id, nombre, precio_venta, unidad_medida) VALUES
      ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Nachos con Queso', 15000, 'unidad'),
      ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Hamburguesa Clásica', 22000, 'unidad'),
      ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Coca-Cola 500ml', 5000, 'unidad'),
      ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Brownie con Helado', 12000, 'unidad')
    ON CONFLICT (id) DO NOTHING;
  `);

  await db.execute(sql`
    INSERT INTO mesas (id, restaurante_id, numero, capacidad, ubicacion) VALUES
      ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 1, 2, 'Interior - Ventana'),
      ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 2, 4, 'Interior - Centro'),
      ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 3, 4, 'Interior - Centro'),
      ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 4, 6, 'Terraza'),
      ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 5, 8, 'Terraza - VIP')
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
