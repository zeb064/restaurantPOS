import { createClient } from "@/lib/supabase/client";

export interface KDSOrden {
  id: string;
  numero_orden: string;
  mesa: string;
  mesero: string;
  tipo: string;
  estado: string;
  nota: string;
  created_at: string;
  items: KDSItem[];
  tiempo: number;
}

export interface KDSItem {
  id: string;
  nombre: string;
  cantidad: number;
  nota: string;
}

const mockOrdenes: KDSOrden[] = [
  {
    id: "o1",
    numero_orden: "#000001",
    mesa: "Mesa 3",
    mesero: "Carlos",
    tipo: "mesa",
    estado: "en_preparacion",
    nota: "",
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    items: [
      { id: "d1", nombre: "Hamburguesa Clásica", cantidad: 2, nota: "Sin cebolla" },
      { id: "d2", nombre: "Papas Fritas", cantidad: 1, nota: "" },
      { id: "d3", nombre: "Coca-Cola 500ml", cantidad: 2, nota: "" },
    ],
    tiempo: 8,
  },
  {
    id: "o2",
    numero_orden: "#000002",
    mesa: "Mesa 5",
    mesero: "Ana",
    tipo: "mesa",
    estado: "pendiente",
    nota: "Cliente alérgico al lácteo",
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    items: [
      { id: "d4", nombre: "Pizza Personal (Pepperoni)", cantidad: 1, nota: "Sin queso extra" },
      { id: "d5", nombre: "Limonada Natural", cantidad: 1, nota: "Sin azúcar" },
    ],
    tiempo: 3,
  },
  {
    id: "o3",
    numero_orden: "#000003",
    mesa: "Mostrador",
    mesero: "Carlos",
    tipo: "mostrador",
    estado: "pendiente",
    nota: "",
    created_at: new Date(Date.now() - 1 * 60000).toISOString(),
    items: [
      { id: "d6", nombre: "Alitas BBQ (6und)", cantidad: 1, nota: "" },
    ],
    tiempo: 1,
  },
];

export async function fetchOrdenesKDS(restauranteId: string): Promise<KDSOrden[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ordenes")
      .select("*, detalles:detalles_orden(*)")
      .eq("restaurante_id", restauranteId)
      .in("estado", ["pendiente", "en_preparacion"])
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!data?.length) return mockOrdenes;

    return data.map((o) => ({
      id: o.id,
      numero_orden: o.numero_orden ?? o.id.slice(0, 8).toUpperCase(),
      mesa: o.mesa_id ?? o.tipo === "mostrador" ? "Mostrador" : "Delivery",
      mesero: o.usuario_id,
      tipo: o.tipo,
      estado: o.estado,
      nota: o.nota ?? "",
      created_at: o.created_at,
      items: (o.detalles ?? []).map((d: any) => ({
        id: d.id,
        nombre: d.producto_nombre,
        cantidad: Number(d.cantidad),
        nota: d.nota ?? "",
      })),
      tiempo: Math.floor(
        (Date.now() - new Date(o.created_at).getTime()) / 60000
      ),
    }));
  } catch {
    return mockOrdenes;
  }
}

export async function actualizarEstadoKDS(ordenId: string, estado: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId);

  if (error) throw error;
}
