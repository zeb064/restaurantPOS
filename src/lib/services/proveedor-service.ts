import { createClient } from "@/lib/supabase/client";
import type { Proveedor } from "@/types/database";

const mockProveedores: Proveedor[] = [
  { id: "pr1", restaurante_id: "1", nombre: "Distribuidora ABC", contacto: "Carlos López", telefono: "+57 311 222 3344", email: "carlos@distabc.com", direccion: "Cra 50 #20-30", created_at: "", updated_at: "" },
  { id: "pr2", restaurante_id: "1", nombre: "Bebidas del Valle", contacto: "Ana María Pérez", telefono: "+57 315 555 6677", email: "ana@bebidasvalle.com", direccion: "Cl 10 #5-40", created_at: "", updated_at: "" },
  { id: "pr3", restaurante_id: "1", nombre: "Carnes Premium SAS", contacto: "Pedro Rodríguez", telefono: "+57 300 888 9900", email: "pedro@carnespremium.com", direccion: "Autopista Sur #45-12", created_at: "", updated_at: "" },
  { id: "pr4", restaurante_id: "1", nombre: "Lácteos del Campo", contacto: "María Gómez", telefono: "+57 312 333 4455", email: "maria@lacteoscampo.com", direccion: "Vereda La Esperanza", created_at: "", updated_at: "" },
];

export async function fetchProveedores(restauranteId: string): Promise<Proveedor[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("proveedores")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("nombre");

    if (error) throw error;
    return data?.length ? data : mockProveedores;
  } catch {
    return mockProveedores;
  }
}

export async function crearProveedor(input: Omit<Proveedor, "id" | "created_at" | "updated_at">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("proveedores")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarProveedor(id: string, input: Partial<Proveedor>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("proveedores")
    .update(input)
    .eq("id", id);

  if (error) throw error;
}
