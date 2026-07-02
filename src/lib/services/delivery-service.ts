import { createClient } from "@/lib/supabase/client";
import type { Orden } from "@/types/database";

export interface DeliveryOrden {
  id: string;
  numero_orden: string;
  cliente: string;
  direccion: string;
  telefono: string;
  total: number;
  estado: string;
  repartidor?: string;
  created_at: string;
  items: { nombre: string; cantidad: number }[];
}

const mockDeliveries: DeliveryOrden[] = [
  {
    id: "d1",
    numero_orden: "#000003",
    cliente: "Juan Pérez",
    direccion: "Calle 45 #23-12, Apto 301",
    telefono: "+57 300 111 2233",
    total: 28000,
    estado: "pendiente",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    items: [
      { nombre: "Hamburguesa Clásica", cantidad: 1 },
      { nombre: "Papas Fritas", cantidad: 1 },
    ],
  },
  {
    id: "d2",
    numero_orden: "#000004",
    cliente: "María Gómez",
    direccion: "Carrera 12 #34-56, Casa",
    telefono: "+57 315 444 5566",
    total: 35000,
    estado: "en_camino",
    repartidor: "Pedro",
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    items: [
      { nombre: "Pizza Personal (Pepperoni)", cantidad: 1 },
      { nombre: "Coca-Cola 500ml", cantidad: 2 },
      { nombre: "Brownie con Helado", cantidad: 1 },
    ],
  },
];

export async function fetchDeliveries(restauranteId: string): Promise<DeliveryOrden[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ordenes")
      .select("*, detalles:detalles_orden(*)")
      .eq("restaurante_id", restauranteId)
      .eq("tipo", "delivery")
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!data?.length) return mockDeliveries;

    return data.map((o) => ({
      id: o.id,
      numero_orden: o.numero_orden ?? o.id.slice(0, 8).toUpperCase(),
      cliente: o.cliente_nombre ?? "Cliente",
      direccion: "",
      telefono: "",
      total: Number(o.total),
      estado: o.estado,
      created_at: o.created_at,
      items: (o.detalles ?? []).map((d: any) => ({
        nombre: d.producto_nombre,
        cantidad: Number(d.cantidad),
      })),
    }));
  } catch {
    return mockDeliveries;
  }
}

export async function actualizarEstadoDelivery(ordenId: string, estado: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId);

  if (error) throw error;
}
