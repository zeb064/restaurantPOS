import { createClient } from "@/lib/supabase/client";
import type { Categoria, Producto } from "@/types/database";

// Mock data for development
const mockCategorias: Categoria[] = [
  { id: "1", restaurante_id: "1", nombre: "Entradas", orden: 1, activo: true, created_at: "" } as Categoria,
  { id: "2", restaurante_id: "1", nombre: "Platos Fuertes", orden: 2, activo: true, created_at: "" } as Categoria,
  { id: "3", restaurante_id: "1", nombre: "Bebidas", orden: 3, activo: true, created_at: "" } as Categoria,
  { id: "4", restaurante_id: "1", nombre: "Postres", orden: 4, activo: true, created_at: "" } as Categoria,
  { id: "5", restaurante_id: "1", nombre: "Complementos", orden: 5, activo: true, created_at: "" } as Categoria,
];

const mockProductos: Producto[] = [
  { id: "p1", restaurante_id: "1", categoria_id: "1", nombre: "Nachos con Queso", precio_venta: 15000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p2", restaurante_id: "1", categoria_id: "1", nombre: "Alitas BBQ (6und)", precio_venta: 22000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p3", restaurante_id: "1", categoria_id: "2", nombre: "Hamburguesa Clásica", precio_venta: 22000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p4", restaurante_id: "1", categoria_id: "2", nombre: "Hamburguesa BBQ", precio_venta: 25000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p5", restaurante_id: "1", categoria_id: "2", nombre: "Pizza Personal (Pepperoni)", precio_venta: 18000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p6", restaurante_id: "1", categoria_id: "2", nombre: "Pizza Personal (Hawaiana)", precio_venta: 18000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p7", restaurante_id: "1", categoria_id: "3", nombre: "Coca-Cola 500ml", precio_venta: 5000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p8", restaurante_id: "1", categoria_id: "3", nombre: "Limonada Natural", precio_venta: 7000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p9", restaurante_id: "1", categoria_id: "3", nombre: "Cerveza Artesanal", precio_venta: 12000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p10", restaurante_id: "1", categoria_id: "3", nombre: "Agua sin Gas", precio_venta: 4000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p11", restaurante_id: "1", categoria_id: "4", nombre: "Brownie con Helado", precio_venta: 12000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p12", restaurante_id: "1", categoria_id: "4", nombre: "Flan Casero", precio_venta: 9000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p13", restaurante_id: "1", categoria_id: "5", nombre: "Papas Fritas", precio_venta: 8000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
  { id: "p14", restaurante_id: "1", categoria_id: "5", nombre: "Aros de Cebolla", precio_venta: 9000, unidad_medida: "unidad", impuesto: 19, impoconsumo: 0, es_combo: false, activo: true, created_at: "" } as Producto,
];

export async function fetchCategorias(restauranteId: string): Promise<Categoria[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .eq("activo", true)
      .order("orden");

    if (error) throw error;
    return data?.length ? data : mockCategorias;
  } catch {
    return mockCategorias;
  }
}

export async function fetchProductos(
  restauranteId: string,
  categoriaId?: string
): Promise<Producto[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("productos")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .eq("activo", true);

    if (categoriaId) {
      query = query.eq("categoria_id", categoriaId);
    }

    const { data, error } = await query.order("nombre");
    if (error) throw error;
    return data?.length ? data : filtrarMock(mockProductos, categoriaId);
  } catch {
    return filtrarMock(mockProductos, categoriaId);
  }
}

function filtrarMock(productos: Producto[], categoriaId?: string): Producto[] {
  if (!categoriaId) return productos;
  return productos.filter((p) => p.categoria_id === categoriaId);
}
