import { createClient } from "@/lib/supabase/client";
import type { Inventario } from "@/types/database";

export interface StockAlert {
  item: Inventario;
  deficit: number;
}

const mockInventario: Inventario[] = [
  { id: "i1", restaurante_id: "1", nombre: "Carne de Res (kg)", unidad_medida: "kg", cantidad_actual: 8, cantidad_minima: 10, costo_unitario: 18000, created_at: "", updated_at: "" },
  { id: "i2", restaurante_id: "1", nombre: "Pan de Hamburguesa (und)", unidad_medida: "unidad", cantidad_actual: 25, cantidad_minima: 20, costo_unitario: 1200, created_at: "", updated_at: "" },
  { id: "i3", restaurante_id: "1", nombre: "Queso Mozzarella (kg)", unidad_medida: "kg", cantidad_actual: 3, cantidad_minima: 5, costo_unitario: 14000, created_at: "", updated_at: "" },
  { id: "i4", restaurante_id: "1", nombre: "Papa (kg)", unidad_medida: "kg", cantidad_actual: 15, cantidad_minima: 10, costo_unitario: 3000, created_at: "", updated_at: "" },
  { id: "i5", restaurante_id: "1", nombre: "Aceite Vegetal (L)", unidad_medida: "L", cantidad_actual: 2, cantidad_minima: 3, costo_unitario: 8000, created_at: "", updated_at: "" },
  { id: "i6", restaurante_id: "1", nombre: "Harina de Trigo (kg)", unidad_medida: "kg", cantidad_actual: 12, cantidad_minima: 5, costo_unitario: 2500, created_at: "", updated_at: "" },
  { id: "i7", restaurante_id: "1", nombre: "Coca-Cola 500ml (und)", unidad_medida: "unidad", cantidad_actual: 48, cantidad_minima: 24, costo_unitario: 3200, created_at: "", updated_at: "" },
  { id: "i8", restaurante_id: "1", nombre: "Tomate (kg)", unidad_medida: "kg", cantidad_actual: 2, cantidad_minima: 5, costo_unitario: 4000, created_at: "", updated_at: "" },
  { id: "i9", restaurante_id: "1", nombre: "Cebolla (kg)", unidad_medida: "kg", cantidad_actual: 4, cantidad_minima: 5, costo_unitario: 3500, created_at: "", updated_at: "" },
  { id: "i10", restaurante_id: "1", nombre: "Lechuga (und)", unidad_medida: "unidad", cantidad_actual: 6, cantidad_minima: 5, costo_unitario: 2000, created_at: "", updated_at: "" },
  { id: "i11", restaurante_id: "1", nombre: "Salsa BBQ (L)", unidad_medida: "L", cantidad_actual: 1, cantidad_minima: 2, costo_unitario: 10000, created_at: "", updated_at: "" },
  { id: "i12", restaurante_id: "1", nombre: "Huevos (und)", unidad_medida: "unidad", cantidad_actual: 60, cantidad_minima: 30, costo_unitario: 500, created_at: "", updated_at: "" },
];

export async function fetchInventario(restauranteId: string): Promise<Inventario[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inventario")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("nombre");

    if (error) throw error;
    return data?.length ? data : mockInventario;
  } catch {
    return mockInventario;
  }
}

export async function getAlertasStock(restauranteId: string): Promise<StockAlert[]> {
  const items = await fetchInventario(restauranteId);
  return items
    .filter((i) => i.cantidad_actual < i.cantidad_minima)
    .map((item) => ({
      item,
      deficit: item.cantidad_minima - item.cantidad_actual,
    }));
}

export function calcularValorInventario(items: Inventario[]): number {
  return items.reduce((sum, i) => sum + i.cantidad_actual * i.costo_unitario, 0);
}

export async function actualizarStock(
  inventarioId: string,
  cantidad: number,
  costoUnitario?: number
) {
  const supabase = createClient();
  const updates: Partial<Inventario> = { cantidad_actual: cantidad };
  if (costoUnitario !== undefined) updates.costo_unitario = costoUnitario;

  const { error } = await supabase
    .from("inventario")
    .update(updates)
    .eq("id", inventarioId);

  if (error) throw error;
}

export async function crearItemInventario(item: Omit<Inventario, "id" | "created_at" | "updated_at">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventario")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}
