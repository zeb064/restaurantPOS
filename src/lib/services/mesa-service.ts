import { createClient } from "@/lib/supabase/client";
import type { Mesa } from "@/types/database";

const mockMesas: Mesa[] = [
  { id: "m1", restaurante_id: "1", numero: 1, nombre: "Mesa 1", capacidad: 2, ubicacion: "Interior - Ventana", estado: "libre", created_at: "" },
  { id: "m2", restaurante_id: "1", numero: 2, nombre: "Mesa 2", capacidad: 4, ubicacion: "Interior - Centro", estado: "libre", created_at: "" },
  { id: "m3", restaurante_id: "1", numero: 3, nombre: "Mesa 3", capacidad: 4, ubicacion: "Interior - Centro", estado: "ocupada", created_at: "" },
  { id: "m4", restaurante_id: "1", numero: 4, nombre: "Mesa 4", capacidad: 6, ubicacion: "Interior - Salón", estado: "libre", created_at: "" },
  { id: "m5", restaurante_id: "1", numero: 5, nombre: "Mesa 5", capacidad: 2, ubicacion: "Terraza", estado: "pidiendo", created_at: "" },
  { id: "m6", restaurante_id: "1", numero: 6, nombre: "Mesa 6", capacidad: 4, ubicacion: "Terraza", estado: "ocupada", created_at: "" },
  { id: "m7", restaurante_id: "1", numero: 7, nombre: "Mesa 7", capacidad: 4, ubicacion: "Terraza", estado: "libre", created_at: "" },
  { id: "m8", restaurante_id: "1", numero: 8, nombre: "Mesa 8", capacidad: 8, ubicacion: "Terraza - VIP", estado: "cuenta_pedida", created_at: "" },
  { id: "m9", restaurante_id: "1", numero: 9, nombre: "Mesa 9", capacidad: 6, ubicacion: "Interior - Privado", estado: "libre", created_at: "" },
  { id: "m10", restaurante_id: "1", numero: 10, nombre: "Barra", capacidad: 1, ubicacion: "Barra", estado: "libre", created_at: "" },
];

export async function fetchMesas(restauranteId: string): Promise<Mesa[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mesas")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("numero");

    if (error) throw error;
    return data?.length ? data : mockMesas;
  } catch {
    return mockMesas;
  }
}

export async function actualizarEstadoMesa(mesaId: string, estado: Mesa["estado"]) {
  const supabase = createClient();
  const { error } = await supabase
    .from("mesas")
    .update({ estado })
    .eq("id", mesaId);

  if (error) throw error;
}

export async function generarQRMesa(
  restauranteId: string,
  mesaId: string,
  mesaNumero: number
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const menuUrl = `${baseUrl}/menu/${restauranteId}?mesa=${mesaId}`;

  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;
    return qrApiUrl;
  } catch {
    return menuUrl;
  }
}

export async function crearMesa(input: {
  restauranteId: string;
  numero: number;
  nombre?: string;
  capacidad: number;
  ubicacion?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mesas")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
