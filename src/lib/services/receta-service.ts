import { createClient } from "@/lib/supabase/client";
import type { Receta, IngredienteReceta, Inventario } from "@/types/database";
import { fetchInventario } from "./inventario-service";

export interface RecetaConCosto extends Receta {
  costo_total: number;
  costo_porcion: number;
  ingredientes: (IngredienteReceta & { item_nombre: string; costo_unitario: number })[];
}

const mockRecetas: Receta[] = [
  { id: "r1", restaurante_id: "1", producto_id: "p3", nombre: "Hamburguesa Clásica", porciones: 1, created_at: "", updated_at: "" },
  { id: "r2", restaurante_id: "1", producto_id: "p4", nombre: "Hamburguesa BBQ", porciones: 1, created_at: "", updated_at: "" },
  { id: "r3", restaurante_id: "1", producto_id: "p5", nombre: "Pizza Personal Pepperoni", porciones: 1, created_at: "", updated_at: "" },
];

const mockIngredientes: (IngredienteReceta & { item_nombre: string; costo_unitario: number })[] = [
  { id: "ir1", receta_id: "r1", inventario_id: "i1", cantidad: 0.15, created_at: "", item_nombre: "Carne de Res (kg)", costo_unitario: 18000 },
  { id: "ir2", receta_id: "r1", inventario_id: "i2", cantidad: 1, created_at: "", item_nombre: "Pan de Hamburguesa (und)", costo_unitario: 1200 },
  { id: "ir3", receta_id: "r1", inventario_id: "i3", cantidad: 0.05, created_at: "", item_nombre: "Queso Mozzarella (kg)", costo_unitario: 14000 },
  { id: "ir4", receta_id: "r1", inventario_id: "i9", cantidad: 0.02, created_at: "", item_nombre: "Cebolla (kg)", costo_unitario: 3500 },
  { id: "ir5", receta_id: "r1", inventario_id: "i10", cantidad: 0.5, created_at: "", item_nombre: "Lechuga (und)", costo_unitario: 2000 },
  { id: "ir6", receta_id: "r1", inventario_id: "i8", cantidad: 0.03, created_at: "", item_nombre: "Tomate (kg)", costo_unitario: 4000 },
  { id: "ir7", receta_id: "r2", inventario_id: "i1", cantidad: 0.15, created_at: "", item_nombre: "Carne de Res (kg)", costo_unitario: 18000 },
  { id: "ir8", receta_id: "r2", inventario_id: "i2", cantidad: 1, created_at: "", item_nombre: "Pan de Hamburguesa (und)", costo_unitario: 1200 },
  { id: "ir9", receta_id: "r2", inventario_id: "i3", cantidad: 0.05, created_at: "", item_nombre: "Queso Mozzarella (kg)", costo_unitario: 14000 },
  { id: "ir10", receta_id: "r2", inventario_id: "i11", cantidad: 0.03, created_at: "", item_nombre: "Salsa BBQ (L)", costo_unitario: 10000 },
  { id: "ir11", receta_id: "r3", inventario_id: "i6", cantidad: 0.2, created_at: "", item_nombre: "Harina de Trigo (kg)", costo_unitario: 2500 },
  { id: "ir12", receta_id: "r3", inventario_id: "i3", cantidad: 0.12, created_at: "", item_nombre: "Queso Mozzarella (kg)", costo_unitario: 14000 },
  { id: "ir13", receta_id: "r3", inventario_id: "i11", cantidad: 0.02, created_at: "", item_nombre: "Salsa BBQ (L)", costo_unitario: 10000 },
];

export async function fetchRecetas(restauranteId: string): Promise<RecetaConCosto[]> {
  try {
    const supabase = createClient();
    const { data: recetas, error } = await supabase
      .from("recetas")
      .select("*")
      .eq("restaurante_id", restauranteId);

    if (error) throw error;
    if (!recetas?.length) return mockRecetasConCosto();

    const items = await fetchInventario(restauranteId);
    const itemMap = new Map(items.map((i) => [i.id, i]));

    return await Promise.all(
      recetas.map(async (r) => {
        const { data: ingredientes } = await supabase
          .from("ingredientes_receta")
          .select("*")
          .eq("receta_id", r.id);

        const ingConNombre = (ingredientes ?? []).map((ing) => {
          const invItem = itemMap.get(ing.inventario_id);
          return {
            ...ing,
            item_nombre: invItem?.nombre ?? "Desconocido",
            costo_unitario: invItem?.costo_unitario ?? 0,
          };
        });

        return calcularCostos(r, ingConNombre);
      })
    );
  } catch {
    return mockRecetasConCosto();
  }
}

function mockRecetasConCosto(): RecetaConCosto[] {
  return mockRecetas.map((r) => {
    const ings = mockIngredientes.filter((i) => i.receta_id === r.id);
    return calcularCostos(r, ings);
  });
}

function calcularCostos(
  receta: Receta,
  ingredientes: (IngredienteReceta & { item_nombre: string; costo_unitario: number })[]
): RecetaConCosto {
  const costoTotal = ingredientes.reduce(
    (sum, ing) => sum + ing.cantidad * ing.costo_unitario,
    0
  );

  return {
    ...receta,
    ingredientes,
    costo_total: costoTotal,
    costo_porcion: receta.porciones > 0 ? costoTotal / receta.porciones : costoTotal,
  };
}

export async function descontarInventario(recetaId: string, cantidad: number) {
  const supabase = createClient();
  const { data: ingredientes, error } = await supabase
    .from("ingredientes_receta")
    .select("*, inventario:inventario!inner(cantidad_actual)")
    .eq("receta_id", recetaId);

  if (error) throw error;
  if (!ingredientes?.length) return;

  for (const ing of ingredientes) {
    const nuevaCantidad = Math.max(0, ing.inventario.cantidad_actual - ing.cantidad * cantidad);
    await supabase
      .from("inventario")
      .update({ cantidad_actual: nuevaCantidad })
      .eq("id", ing.inventario_id);
  }
}
